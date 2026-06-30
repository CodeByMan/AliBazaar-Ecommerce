'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Breadcrumb from '../Common/Breadcrumb';
import {
  type CheckoutBreakdown,
  type CheckoutConfig,
  type CheckoutCustomer,
  createPaymentIntent,
  getCheckoutConfig,
} from '@/lib/api/checkout';
import { validateCoupon, type CouponValidation } from '@/lib/api/commerce';
import { formatPKR } from '@/lib/currency';
import { ApiRequestError } from '@/lib/api/auth';
import { withRedirect } from '@/lib/auth-redirect';
import { selectTotalPrice } from '@/redux/features/cart-slice';
import { useAppSelector } from '@/redux/store';
import StripePaymentForm from './StripePaymentForm';
import MockPaymentForm from './MockPaymentForm';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const initialCustomer: CheckoutCustomer = {
  fullName: '', email: '', phone: '', address: '', city: '', stateProvince: '', postalCode: '', country: 'Pakistan', notes: '',
};
type FieldErrors = Partial<Record<keyof CheckoutCustomer, string>>;

const validateCustomer = (customer: CheckoutCustomer): FieldErrors => {
  const errors: FieldErrors = {};
  if (customer.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) errors.email = 'Enter a valid email address.';
  if (!/^\+?[0-9][0-9\s-]{8,19}$/.test(customer.phone.trim())) errors.phone = 'Enter a valid phone number.';
  if (customer.address.trim().length < 5) errors.address = 'Enter your delivery address.';
  if (customer.city.trim().length < 2) errors.city = 'Enter your city.';
  if (customer.stateProvince.trim().length < 2) errors.stateProvince = 'Enter your province or state.';
  if (!/^[A-Za-z0-9 -]{3,20}$/.test(customer.postalCode.trim())) errors.postalCode = 'Enter a valid postal code.';
  if (customer.country.trim().length < 2) errors.country = 'Enter your country.';
  if ((customer.notes || '').length > 1000) errors.notes = 'Notes cannot exceed 1,000 characters.';
  return errors;
};

export default function Checkout() {
  const router = useRouter();
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const hydrated = useAppSelector((state) => state.cartReducer.hydrated);
  const localSubtotal = useAppSelector(selectTotalPrice);
  const authStatus = useAppSelector((state) => state.authReducer.status);
  const authUser = useAppSelector((state) => state.authReducer.user);
  const [customer, setCustomer] = useState(initialCustomer);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [configError, setConfigError] = useState('');
  const [configLoading, setConfigLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [breakdown, setBreakdown] = useState<CheckoutBreakdown | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutReference, setCheckoutReference] = useState('');

  useEffect(() => {
    if (authStatus === 'guest') router.replace(withRedirect('/signin', '/checkout'));
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !authUser || deliveryReady) return;
    setCustomer((current) => ({ ...current, fullName: current.fullName || authUser.name, email: current.email || authUser.email, phone: current.phone || authUser.phone }));
  }, [authStatus, authUser, deliveryReady]);

  const loadCheckoutConfig = useCallback(async (signal?: AbortSignal) => {
    setConfigLoading(true);
    setConfigError('');
    try {
      const nextConfig = await getCheckoutConfig(signal);
      setConfig(nextConfig);
      return nextConfig;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return null;
      const message = error instanceof Error ? error.message : 'Checkout configuration is unavailable.';
      setConfigError(message);
      return null;
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadCheckoutConfig(controller.signal);
    return () => controller.abort();
  }, [loadCheckoutConfig]);

  const estimatedDelivery = useMemo(() => {
    if (!config || cartItems.length === 0) return 0;
    return config.freeDeliveryThreshold > 0 && localSubtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryCharge;
  }, [config, cartItems.length, localSubtotal]);
  const calculatedDiscount = coupon?.discount || 0;
  const calculatedTotal = Math.max(0, localSubtotal + estimatedDelivery - calculatedDiscount);

  const updateField = (field: keyof CheckoutCustomer, value: string) => {
    if (deliveryReady) return;
    setCustomer((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return setSubmitError('Enter a coupon code.');
    setCouponLoading(true); setSubmitError(''); setCoupon(null);
    try { setCoupon(await validateCoupon(couponCode, localSubtotal)); }
    catch (error) { setSubmitError(error instanceof Error ? error.message : 'Coupon could not be applied.'); }
    finally { setCouponLoading(false); }
  };

  const prepareCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || deliveryReady) return;

    const nextErrors = validateCustomer(customer);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setSubmitError('Please correct the highlighted checkout fields.');
      return;
    }
    if (!cartItems.length) {
      setSubmitError('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const activeConfig = config ?? (await loadCheckoutConfig());
      if (!activeConfig) {
        setSubmitError('Payment setup could not be loaded. Confirm the NestJS backend is running, then try again.');
        return;
      }

      const reference = checkoutReference || crypto.randomUUID();
      if (!checkoutReference) setCheckoutReference(reference);

      if (activeConfig.paymentProvider === 'mock') {
        const deliveryCharge =
          activeConfig.freeDeliveryThreshold > 0 && localSubtotal >= activeConfig.freeDeliveryThreshold
            ? 0
            : activeConfig.deliveryCharge;
        setBreakdown({
          subtotal: localSubtotal,
          deliveryCharge,
          discount: calculatedDiscount,
          total: Math.max(0, localSubtotal + deliveryCharge - calculatedDiscount),
          currency: activeConfig.currency || 'PKR',
        });
        setDeliveryReady(true);
        return;
      }

      if (!stripePromise) {
        setSubmitError('Stripe publishable key is not configured. Use PAYMENT_PROVIDER=mock for the FYP demo checkout.');
        return;
      }

      const response = await createPaymentIntent({
        checkoutReference: reference,
        customer,
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
        couponCode: coupon?.code,
      });
      if (response.alreadyCompleted && response.order) {
        window.location.assign(`/order-success?orderId=${encodeURIComponent(response.order.orderNumber)}`);
        return;
      }
      if (!response.clientSecret || !response.paymentIntentId || !response.breakdown) {
        throw new Error('The payment service returned an incomplete response.');
      }
      setClientSecret(response.clientSecret);
      setPaymentIntentId(response.paymentIntentId);
      setBreakdown(response.breakdown);
      setDeliveryReady(true);
    } catch (error) {
      if (error instanceof ApiRequestError && [401, 403].includes(error.status)) {
        router.replace(withRedirect('/signin', '/checkout'));
        return;
      }
      setSubmitError(error instanceof Error ? error.message : 'Unable to start checkout.');
      setCheckoutReference('');
    } finally {
      setSubmitting(false);
    }
  };

  const resetPaymentStep = () => {
    setDeliveryReady(false);
    setClientSecret('');
    setPaymentIntentId('');
    setBreakdown(null);
    setCheckoutReference('');
  };

  const fieldClass = (field: keyof CheckoutCustomer) => `w-full rounded-md border bg-gray-1 px-5 py-3 outline-none duration-200 focus:ring-2 focus:ring-blue/20 ${errors[field] ? 'border-red' : 'border-gray-3 focus:border-transparent'}`;

  if (!hydrated || authStatus === 'loading') return <div className="min-h-[420px] bg-gray-2 py-12 text-center sm:py-20">Loading checkout…</div>;
  if (authStatus !== 'authenticated' || !authUser) return <div className="min-h-[420px] bg-gray-2 py-12 text-center sm:py-20">Redirecting to customer sign in…</div>;

  return <>
    <Breadcrumb title="Checkout" pages={['checkout']} />
    <section className="overflow-hidden bg-gray-2 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
        {!cartItems.length ? <div className="rounded-[10px] bg-white p-5 text-center shadow-1 sm:p-8">
          <h2 className="font-medium text-2xl text-dark">Your cart is empty</h2><p className="mt-3 text-dark-4">Add at least one product before starting checkout.</p>
          <Link href="/shop-with-sidebar" className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue px-7 py-3 font-medium text-white hover:bg-blue-dark">Continue Shopping</Link>
        </div> : <form onSubmit={prepareCheckout} noValidate>
          <div className="flex flex-col gap-6 sm:gap-7.5 lg:flex-row xl:gap-11">
            <div className="w-full lg:max-w-[670px]">
              <h2 className="mb-5.5 font-medium text-xl text-dark sm:text-2xl">Customer & Delivery Information</h2>
              <div className="rounded-[10px] bg-white p-4 shadow-1 sm:p-8.5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {([
                    ['fullName','Full Name','Muhammad Ali Nawaz','text'], ['email','Email','name@example.com','email'], ['phone','Phone Number','+92 300 1234567','tel'],
                    ['city','City','Karachi','text'], ['stateProvince','Province / State','Sindh','text'], ['postalCode','Postal Code','75500','text'],
                  ] as const).map(([field,label,placeholder,type]) => <label key={field} className="block"><span className="mb-2.5 block">{label} <span className="text-red">*</span></span>
                    <input type={type} value={customer[field] || ''} onChange={(e) => updateField(field,e.target.value)} disabled={deliveryReady} placeholder={placeholder} className={fieldClass(field)} />
                    {errors[field] && <span className="mt-1 block text-custom-xs text-red">{errors[field]}</span>}</label>)}
                </div>
                <label className="mt-5 block"><span className="mb-2.5 block">Address <span className="text-red">*</span></span><input value={customer.address} onChange={(e) => updateField('address',e.target.value)} disabled={deliveryReady} placeholder="House number, street, area" className={fieldClass('address')} />{errors.address && <span className="mt-1 block text-custom-xs text-red">{errors.address}</span>}</label>
                <label className="mt-5 block"><span className="mb-2.5 block">Country</span><input value={customer.country} readOnly className="w-full rounded-md border border-gray-3 bg-gray-2 px-5 py-3 text-dark-4" /></label>
                <label className="mt-5 block"><span className="mb-2.5 block">Additional Notes (optional)</span><textarea rows={4} value={customer.notes || ''} onChange={(e) => updateField('notes',e.target.value)} disabled={deliveryReady} className={fieldClass('notes')} placeholder="Delivery instructions or other notes" />{errors.notes && <span className="mt-1 block text-custom-xs text-red">{errors.notes}</span>}</label>
              </div>

              {deliveryReady && config?.paymentProvider === 'stripe' && clientSecret && stripePromise && breakdown && <div className="mt-7.5 rounded-[10px] bg-white p-4 shadow-1 sm:p-8.5">
                <h2 className="font-medium text-xl text-dark">Secure Stripe Payment</h2><p className="mt-2 text-custom-sm text-dark-4">Your stock is reserved while you complete payment.</p>
                <Elements stripe={stripePromise} options={{ clientSecret, appearance:{ theme:'stripe', variables:{ colorPrimary:'#3c50e0', borderRadius:'6px' } } }}><StripePaymentForm paymentIntentId={paymentIntentId} total={breakdown.total} /></Elements>
              </div>}
            </div>

            <aside className="w-full lg:max-w-[455px]"><div className="rounded-[10px] bg-white shadow-1 lg:sticky lg:top-32">
              <div className="border-b border-gray-3 px-4 py-5 sm:px-8.5"><h3 className="font-medium text-xl text-dark">Your Order</h3><p className="mt-1 text-custom-xs text-dark-4">Payment provider: {configLoading && !config ? 'Checking…' : config?.paymentProvider === 'stripe' ? 'Stripe' : config?.paymentProvider === 'mock' ? 'FYP Mock Payment' : 'Unavailable'}</p></div>
              <div className="px-4 pb-8.5 pt-2.5 sm:px-8.5">
                {cartItems.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 border-b border-gray-3 py-5"><p className="min-w-0 text-dark">{item.title} <span className="text-dark-4">× {item.quantity}</span></p><p className="shrink-0 whitespace-nowrap text-dark">{formatPKR(item.discountedPrice*item.quantity)}</p></div>)}
                <div className="mt-5 rounded-md border border-gray-3 bg-gray-1 p-3"><label className="text-custom-sm font-medium text-dark">Coupon code</label><div className="mt-2 flex gap-2"><input value={couponCode} onChange={(e) => {setCouponCode(e.target.value.toUpperCase());setCoupon(null);}} disabled={deliveryReady} placeholder="ALI-XXXX" className="min-w-0 flex-1 rounded-md border border-gray-3 bg-white px-3 py-2 uppercase outline-none focus:border-blue"/><button type="button" onClick={applyCoupon} disabled={couponLoading || deliveryReady} className="rounded-md bg-dark px-4 py-2 text-custom-sm font-medium text-white hover:bg-blue disabled:opacity-50">{couponLoading?'Checking…':'Apply'}</button></div>{coupon && <p className="mt-2 text-custom-xs text-green">Coupon {coupon.code} applied: -{formatPKR(coupon.discount)}</p>}</div>
                <div className="flex justify-between gap-3 border-b border-gray-3 py-5"><span>Subtotal</span><span>{formatPKR(breakdown?.subtotal ?? localSubtotal)}</span></div>
                <div className="flex justify-between gap-3 border-b border-gray-3 py-5"><span>Delivery</span><span>{formatPKR(breakdown?.deliveryCharge ?? estimatedDelivery)}</span></div>
                <div className="flex justify-between gap-3 border-b border-gray-3 py-5"><span>Discount</span><span>-{formatPKR(breakdown?.discount ?? calculatedDiscount)}</span></div>
                <div className="flex justify-between gap-3 pt-5 font-medium text-lg text-dark"><span>Total</span><span>{formatPKR(breakdown?.total ?? calculatedTotal)}</span></div>
                {configError && <div className="mt-4 rounded-md bg-red-light-6 p-3 text-custom-sm text-red"><p>{configError}</p><button type="button" onClick={() => void loadCheckoutConfig()} disabled={configLoading} className="mt-2 font-medium underline disabled:opacity-60">{configLoading ? 'Retrying…' : 'Retry payment setup'}</button></div>}{submitError && <p role="alert" className="mt-4 rounded-md bg-red-light-6 p-3 text-custom-sm text-red">{submitError}</p>}
                {!deliveryReady && <button type="submit" disabled={submitting} className="mt-7.5 flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue px-5 py-3 font-medium text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Preparing Payment…' : config?.paymentProvider === 'mock' ? 'Continue to Demo Payment' : config?.paymentProvider === 'stripe' ? 'Continue to Secure Payment' : configError ? 'Retry and Continue to Payment' : 'Continue to Payment'}</button>}
                {deliveryReady && <button type="button" onClick={resetPaymentStep} className="mt-4 w-full rounded-md border border-gray-3 px-5 py-3 font-medium text-dark hover:border-blue hover:text-blue">Edit Delivery Details</button>}
              </div>
            </div></aside>
          </div>
        </form>}
      </div>
    </section>

    {deliveryReady && config?.paymentProvider === 'mock' && breakdown && (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6" role="presentation">
        <button type="button" className="absolute inset-0 bg-dark/60" onClick={resetPaymentStep} aria-label="Close demo payment" />
        <div role="dialog" aria-modal="true" aria-labelledby="demo-payment-title" className="relative z-10 max-h-[92vh] w-full max-w-[650px] overflow-y-auto rounded-xl bg-white shadow-3">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-3 bg-white px-4 py-4 sm:px-6">
            <div>
              <h2 id="demo-payment-title" className="font-medium text-xl text-dark">Demo Card Payment</h2>
              <p className="mt-1 text-custom-xs text-dark-4">Use the demo account below to complete your FYP checkout.</p>
            </div>
            <button type="button" onClick={resetPaymentStep} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-3 text-xl text-dark hover:border-blue hover:text-blue" aria-label="Close demo payment modal">×</button>
          </div>
          <div className="p-4 sm:p-6">
            <MockPaymentForm
              checkoutReference={checkoutReference}
              customer={customer}
              items={cartItems.map((item) => ({ productId: item.id, quantity: item.quantity }))}
              couponCode={coupon?.code}
              total={breakdown.total}
              successCard={config.mockPayment?.successCard || '4242 4242 4242 4242'}
              declineCard={config.mockPayment?.declineCard || '4000 0000 0000 0002'}
              expiryHint={config.mockPayment?.expiry || 'Any future month and year'}
              cvcHint={config.mockPayment?.cvc || 'Any 3 or 4 digits'}
            />
          </div>
        </div>
      </div>
    )}
  </>;
}
