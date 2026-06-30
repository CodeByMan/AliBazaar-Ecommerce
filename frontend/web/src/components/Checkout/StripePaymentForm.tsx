'use client';

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { confirmPaymentOrder } from '@/lib/api/checkout';
import { ApiRequestError } from '@/lib/api/auth';
import { withRedirect } from '@/lib/auth-redirect';
import { formatPKR } from '@/lib/currency';
import { removeAllItemsFromCart } from '@/redux/features/cart-slice';
import { AppDispatch } from '@/redux/store';

const StripePaymentForm = ({
  paymentIntentId,
  total,
}: {
  paymentIntentId: string;
  total: number;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-return`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || 'Payment could not be completed.');
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        const order = await confirmPaymentOrder(paymentIntentId);
        dispatch(removeAllItemsFromCart());
        router.replace(`/order-success?orderId=${encodeURIComponent(order.orderNumber)}`);
        return;
      }

      setError('Your payment is still processing. Please do not submit another payment.');
    } catch (paymentError) {
      if (paymentError instanceof ApiRequestError && [401, 403].includes(paymentError.status)) {
        router.replace(
          withRedirect(
            '/signin',
            `/payment-return?payment_intent=${encodeURIComponent(paymentIntentId)}`,
          ),
        );
        return;
      }
      setError(paymentError instanceof Error ? paymentError.message : 'Payment could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <div role="alert" className="mt-5 rounded-md border border-red-light-4 bg-red-light-6 p-4 text-red">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handlePayment}
        disabled={!stripe || !elements || submitting}
        className="mt-6 flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue px-5 py-3 text-center font-medium text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Processing Payment…' : `Pay ${formatPKR(total)}`}
      </button>
      <p className="mt-3 text-center text-custom-xs text-dark-4">
        Payment details are collected securely by Stripe. AliBazaar never receives your card number.
      </p>
    </div>
  );
};

export default StripePaymentForm;
