'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
  completeMockCheckout,
  type CheckoutCustomer,
  type CheckoutItemRequest,
} from '@/lib/api/checkout';
import { ApiRequestError } from '@/lib/api/auth';
import { formatPKR } from '@/lib/currency';
import { removeAllItemsFromCart } from '@/redux/features/cart-slice';
import type { AppDispatch } from '@/redux/store';

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const formatCardNumber = (value: string) =>
  digitsOnly(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (value: string) => {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export default function MockPaymentForm({
  checkoutReference,
  customer,
  items,
  couponCode,
  total,
  successCard,
  declineCard,
  expiryHint,
  cvcHint,
}: {
  checkoutReference: string;
  customer: CheckoutCustomer;
  items: CheckoutItemRequest[];
  couponCode?: string;
  total: number;
  successCard: string;
  declineCard: string;
  expiryHint: string;
  cvcHint: string;
}) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [card, setCard] = useState({
    cardholderName: customer.fullName,
    cardNumber: successCard,
    expiry: '',
    cvc: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof card, value: string) => {
    setCard((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const pay = async () => {
    if (loading) return;
    const cardNumber = digitsOnly(card.cardNumber);
    const expiryMatch = card.expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);

    if (card.cardholderName.trim().length < 2) {
      return setError('Enter the cardholder name.');
    }
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return setError('Enter a valid demo card number.');
    }
    if (!expiryMatch) return setError('Enter the expiry date as MM/YY.');
    if (!/^\d{3,4}$/.test(card.cvc)) return setError('Enter a valid CVC.');

    const expiryMonth = Number(expiryMatch[1]);
    const expiryYear = 2000 + Number(expiryMatch[2]);
    const now = new Date();
    const expiration = new Date(expiryYear, expiryMonth, 1);
    if (expiration <= new Date(now.getFullYear(), now.getMonth(), 1)) {
      return setError('Enter a future expiry date.');
    }

    setLoading(true);
    setError('');
    try {
      const order = await completeMockCheckout({
        checkoutReference,
        customer,
        items,
        couponCode: couponCode || undefined,
        card: {
          cardholderName: card.cardholderName.trim(),
          cardNumber: formatCardNumber(cardNumber),
          expiryMonth,
          expiryYear,
          cvc: card.cvc,
        },
      });
      dispatch(removeAllItemsFromCart());
      router.replace(
        `/order-success?orderId=${encodeURIComponent(order.orderNumber)}`,
      );
    } catch (requestError) {
      if (
        requestError instanceof ApiRequestError &&
        [401, 403].includes(requestError.status)
      ) {
        router.replace('/signin?redirect=/checkout');
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Demo payment could not be completed.',
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-gray-3 bg-gray-1 px-4 py-3 outline-none duration-200 focus:border-transparent focus:ring-2 focus:ring-blue/20';

  return (
    <div className="mt-5">
      <div className="rounded-md border border-blue-light-4 bg-blue-light-5 p-4 text-custom-sm text-dark">
        <p className="font-medium text-blue-dark">FYP Demo Payment Account</p>
        <p className="mt-1 text-dark-4">No real money is charged.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => update('cardNumber', successCard)}
            className="rounded-md border border-blue-light-3 bg-white px-3 py-2 text-left text-custom-xs hover:border-blue"
          >
            Success card: <strong>{successCard}</strong>
          </button>
          <button
            type="button"
            onClick={() => update('cardNumber', declineCard)}
            className="rounded-md border border-red-light-4 bg-white px-3 py-2 text-left text-custom-xs hover:border-red"
          >
            Decline card: <strong>{declineCard}</strong>
          </button>
        </div>
        <div className="mt-3 grid gap-2 text-custom-xs sm:grid-cols-2">
          <p><strong>Expiry:</strong> {expiryHint}</p>
          <p><strong>CVC:</strong> {cvcHint}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-2 block text-custom-sm">Cardholder Name</span>
          <input
            value={card.cardholderName}
            onChange={(event) => update('cardholderName', event.target.value)}
            className={inputClass}
            autoComplete="cc-name"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-custom-sm">Demo Card Number</span>
          <input
            value={card.cardNumber}
            onChange={(event) =>
              update('cardNumber', formatCardNumber(event.target.value))
            }
            className={inputClass}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
          />
        </label>
        <label>
          <span className="mb-2 block text-custom-sm">Expiry Date</span>
          <input
            value={card.expiry}
            onChange={(event) => update('expiry', formatExpiry(event.target.value))}
            className={inputClass}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            maxLength={5}
          />
        </label>
        <label>
          <span className="mb-2 block text-custom-sm">CVC</span>
          <input
            value={card.cvc}
            onChange={(event) =>
              update('cvc', digitsOnly(event.target.value).slice(0, 4))
            }
            className={inputClass}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-md border border-red-light-4 bg-red-light-6 p-4 text-red"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="mt-6 flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue px-5 py-3 font-medium text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? 'Completing Demo Checkout…'
          : `Complete Checkout — ${formatPKR(total)}`}
      </button>
      <p className="mt-3 text-center text-custom-xs text-dark-4">
        Only the last four digits and test-payment reference are stored. Full
        card details and CVC are never saved.
      </p>
    </div>
  );
}
