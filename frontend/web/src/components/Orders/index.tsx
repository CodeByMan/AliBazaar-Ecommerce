'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { getMyOrders, orderItemImage, type CustomerOrder } from '@/lib/api/commerce';
import { formatOrderDate, formatPKR } from '@/lib/currency';
import ReviewForm from './ReviewForm';

const statusClass = (status: string) => status === 'Delivered' ? 'bg-green-light-6 text-green-dark' : status === 'Cancelled' ? 'bg-red-light-6 text-red' : status === 'Dispatched' ? 'bg-blue-light-5 text-blue-dark' : 'bg-yellow-light-4 text-yellow-dark-2';

export default function Orders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState<number[]>([]);

  const load = () => {
    setLoading(true); setError('');
    getMyOrders().then(setOrders).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load orders.')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <div className="p-6 text-center text-dark-4 sm:p-10">Loading your orders…</div>;
  if (error) return <div className="p-6 sm:p-10"><p className="rounded-md bg-red-light-6 p-4 text-red">{error}</p><button onClick={load} className="mt-4 rounded-md bg-blue px-5 py-2.5 text-white">Try Again</button></div>;
  if (!orders.length) return <div className="p-6 text-center sm:p-10"><h3 className="font-medium text-xl text-dark">No orders yet</h3><p className="mt-2 text-dark-4">Your completed checkouts will appear here.</p><Link href="/shop-with-sidebar" className="mt-5 inline-flex rounded-md bg-blue px-6 py-3 font-medium text-white">Start Shopping</Link></div>;

  return <div className="space-y-5 p-4 sm:p-6">
    {orders.map((order) => {
      const expanded = openOrder === order.orderNumber;
      return <article key={order.id} className="overflow-hidden rounded-[10px] border border-gray-3 bg-white">
        <button type="button" onClick={() => setOpenOrder(expanded ? null : order.orderNumber)} className="flex w-full flex-col gap-4 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><p className="font-medium text-blue">{order.orderNumber}</p><p className="mt-1 text-custom-sm text-dark-4">Placed {formatOrderDate(order.createdAt)} · {order.items.length} item(s)</p></div>
          <div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-custom-xs font-medium ${statusClass(order.status)}`}>{order.status}</span><span className="font-medium text-dark">{formatPKR(order.total)}</span><span className="text-dark-4">{expanded ? '−' : '+'}</span></div>
        </button>
        {expanded && <div className="border-t border-gray-3 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md bg-gray-1 p-4"><p className="font-medium text-dark">Delivery</p><p className="mt-2 text-custom-sm text-dark-4">{order.delivery.address}, {order.delivery.city}, {order.delivery.province} {order.delivery.postalCode}</p></div>
            <div className="rounded-md bg-gray-1 p-4"><p className="font-medium text-dark">Payment</p><p className="mt-2 text-custom-sm text-dark-4">{order.payment?.provider || '—'} · {order.payment?.status || 'Pending'}{order.payment?.cardLastFour ? ` · •••• ${order.payment.cardLastFour}` : ''}</p></div>
          </div>
          {order.cancellationReason && <p className="mt-4 rounded-md bg-red-light-6 p-3 text-custom-sm text-red"><strong>Cancellation reason:</strong> {order.cancellationReason}</p>}
          <div className="mt-5 space-y-4">{order.items.map((item) => <div key={item.id} className="rounded-md border border-gray-3 p-3 sm:p-4">
            <div className="flex items-center gap-4"><div className="relative h-16 w-16 shrink-0"><Image fill sizes="64px" className="object-contain" src={orderItemImage(item.productImage)} alt={item.productName} /></div><div className="min-w-0 flex-1"><p className="font-medium text-dark">{item.productName}</p><p className="text-custom-sm text-dark-4">{formatPKR(item.unitPrice)} × {item.quantity}</p></div><p className="shrink-0 font-medium text-dark">{formatPKR(item.lineTotal)}</p></div>
            {item.canReview && !reviewed.includes(item.id) && <div className="mt-3"><button onClick={() => setReviewing(reviewing === item.id ? null : item.id)} className="rounded-md border border-blue px-4 py-2 text-custom-sm font-medium text-blue hover:bg-blue hover:text-white">{reviewing === item.id ? 'Close Review Form' : 'Review Product'}</button>{reviewing === item.id && <ReviewForm orderItemId={item.id} productName={item.productName} onDone={() => { setReviewing(null); setReviewed((v) => [...v,item.id]); }} onCancel={() => setReviewing(null)} />}</div>}
            {reviewed.includes(item.id) && <p className="mt-3 text-custom-sm text-green">Review submitted successfully.</p>}
          </div>)}</div>
          <div className="mt-5 grid gap-2 border-t border-gray-3 pt-4 text-custom-sm sm:ml-auto sm:max-w-xs"><p className="flex justify-between"><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></p><p className="flex justify-between"><span>Delivery</span><span>{formatPKR(order.deliveryCharge)}</span></p><p className="flex justify-between"><span>Discount</span><span>-{formatPKR(order.discount)}</span></p><p className="flex justify-between text-base font-medium text-dark"><span>Total</span><span>{formatPKR(order.total)}</span></p></div>
          <Link href={`/track-order?orderId=${encodeURIComponent(order.orderNumber)}`} className="mt-5 inline-flex rounded-md bg-blue px-5 py-2.5 font-medium text-white hover:bg-blue-dark">Track Order</Link>
        </div>}
      </article>;
    })}
  </div>;
}
