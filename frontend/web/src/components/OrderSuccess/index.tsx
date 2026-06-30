'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Breadcrumb from '../Common/Breadcrumb';
import { trackOrder } from '@/lib/api/checkout';
import type { CustomerOrder } from '@/lib/api/commerce';
import { formatOrderDate, formatPKR } from '@/lib/currency';

export default function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return setError('No order ID was provided.');
    const controller = new AbortController();
    trackOrder(orderId, controller.signal).then(setOrder).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load the order.'));
    return () => controller.abort();
  }, [orderId]);

  return <>
    <Breadcrumb title="Order Confirmed" pages={['order success']} />
    <section className="bg-gray-2 py-12 sm:py-20"><div className="mx-auto max-w-[770px] px-4 sm:px-8"><div className="rounded-[10px] bg-white p-6 text-center shadow-1 sm:p-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-light-6 text-4xl text-green">✓</div>
      <h1 className="mt-6 font-medium text-3xl text-dark">Checkout successful</h1>
      <p className="mt-3 text-dark-4">Your AliBazaar order has been created successfully.</p>
      {error && <p className="mt-6 rounded-md bg-red-light-6 p-4 text-red">{error}</p>}
      {!order && !error && <p className="mt-6 text-dark-4">Loading your order…</p>}
      {order && <div className="mt-8 rounded-[10px] bg-gray-1 p-5 text-left sm:p-6"><div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div><p className="text-custom-sm text-dark-4">Order ID</p><p className="font-medium text-xl text-dark">{order.orderNumber}</p></div>
        <div><p className="text-custom-sm text-dark-4">Amount Paid</p><p className="font-medium text-xl text-dark">{formatPKR(order.total)}</p></div>
        <div><p className="text-custom-sm text-dark-4">Order Date</p><p className="font-medium text-dark">{formatOrderDate(order.createdAt)}</p></div>
        <div><p className="text-custom-sm text-dark-4">Status</p><p className="font-medium text-blue">{order.status}</p></div>
        <div><p className="text-custom-sm text-dark-4">Payment</p><p className="font-medium text-dark">{order.payment?.provider || '—'} · {order.payment?.status || 'Pending'}</p></div>
        <div><p className="text-custom-sm text-dark-4">Coupon</p><p className="font-medium text-dark">{order.couponCode || 'No coupon'}</p></div>
      </div></div>}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`/track-order?orderId=${encodeURIComponent(orderId)}`} className="rounded-md bg-blue px-7 py-3 font-medium text-white hover:bg-blue-dark">Track This Order</Link><Link href="/my-account" className="rounded-md border border-gray-3 px-7 py-3 font-medium text-dark hover:border-blue hover:text-blue">View My Orders</Link><Link href="/shop-with-sidebar" className="rounded-md border border-gray-3 px-7 py-3 font-medium text-dark hover:border-blue hover:text-blue">Continue Shopping</Link></div>
    </div></div></section>
  </>;
}
