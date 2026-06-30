'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { confirmPaymentOrder } from '@/lib/api/checkout';
import { ApiRequestError } from '@/lib/api/auth';
import { withRedirect } from '@/lib/auth-redirect';
import { removeAllItemsFromCart } from '@/redux/features/cart-slice';
import { AppDispatch } from '@/redux/store';

const PaymentReturn = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [error, setError] = useState('');

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    if (!paymentIntentId) {
      setError('Stripe did not return a payment reference.');
      return;
    }

    confirmPaymentOrder(paymentIntentId)
      .then((order) => {
        dispatch(removeAllItemsFromCart());
        router.replace(`/order-success?orderId=${encodeURIComponent(order.orderNumber)}`);
      })
      .catch((returnError) => {
        if (returnError instanceof ApiRequestError && [401, 403].includes(returnError.status)) {
          const returnPath = `/payment-return?${searchParams.toString()}`;
          router.replace(withRedirect('/signin', returnPath));
          return;
        }
        setError(returnError instanceof Error ? returnError.message : 'Unable to verify payment.');
      });
  }, [dispatch, router, searchParams]);

  return (
    <section className="min-h-[420px] bg-gray-2 py-12 sm:min-h-[520px] sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[600px] px-4 text-center">
        <div className="rounded-[10px] bg-white p-5 shadow-1 sm:p-8">
          {error ? (
            <><h1 className="font-medium text-2xl text-dark">Payment verification needs attention</h1><p className="mt-4 rounded-md bg-red-light-6 p-4 text-red">{error}</p></>
          ) : (
            <><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-3 border-t-blue" /><h1 className="mt-6 font-medium text-2xl text-dark">Verifying your payment…</h1><p className="mt-2 text-dark-4">Do not close this page or submit another payment.</p></>
          )}
        </div>
      </div>
    </section>
  );
};

export default PaymentReturn;
