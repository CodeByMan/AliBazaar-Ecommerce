'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import Breadcrumb from '../Common/Breadcrumb';
import { trackOrder } from '@/lib/api/checkout';
import type { CustomerOrder, OrderStatus } from '@/lib/api/commerce';
import { getProductImageUrl } from '@/lib/api/products';
import { formatOrderDate, formatPKR } from '@/lib/currency';

const stages: OrderStatus[] = ['Pending', 'Dispatched', 'Delivered'];

export default function OrderTracking() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookupOrder = useCallback(async (value: string) => {
    const normalized = value.trim().toUpperCase();
    if (!normalized) {
      setError('Enter your AliBazaar order ID.');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      setOrder(await trackOrder(normalized));
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Unable to retrieve this order.');
    } finally {
      setLoading(false);
    }
  }, []);

  const lookup = (event?: React.FormEvent) => {
    event?.preventDefault();
    void lookupOrder(orderId);
  };

  useEffect(() => {
    const initialOrderId = searchParams.get('orderId');
    if (!initialOrderId) return;
    const normalized = initialOrderId.toUpperCase();
    setOrderId(normalized);
    void lookupOrder(normalized);
  }, [lookupOrder, searchParams]);

  const currentIndex = order?.status === 'Cancelled' ? -1 : stages.indexOf(order?.status as OrderStatus);

  return <>
    <Breadcrumb title="Track Order" pages={['track order']} />
    <section className="bg-gray-2 py-12 sm:py-20"><div className="mx-auto w-full max-w-[970px] px-4 sm:px-8 xl:px-0">
      <div className="rounded-[10px] bg-white p-5 shadow-1 sm:p-8.5"><h1 className="font-medium text-2xl text-dark">Track your AliBazaar order</h1><p className="mt-2 text-dark-4">Enter the unique order ID from your checkout success page or profile.</p><form onSubmit={lookup} className="mt-6 flex flex-col gap-3 sm:flex-row"><input value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())} placeholder="ALI-2026-000001" className="min-w-0 flex-1 rounded-md border border-gray-3 bg-gray-1 px-5 py-3 uppercase outline-none focus:border-blue"/><button disabled={loading} className="rounded-md bg-blue px-7 py-3 font-medium text-white hover:bg-blue-dark disabled:opacity-60">{loading?'Checking…':'Track Order'}</button></form>{error && <p className="mt-4 rounded-md bg-red-light-6 p-4 text-red">{error}</p>}</div>
      {order && <div className="mt-7.5 space-y-7.5">
        <div className="rounded-[10px] bg-white p-5 shadow-1 sm:p-8.5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-custom-sm text-dark-4">Order ID</p><h2 className="font-medium text-2xl text-dark">{order.orderNumber}</h2><p className="mt-1 text-custom-sm text-dark-4">Placed {formatOrderDate(order.createdAt)}</p></div><span className={`w-max rounded-full px-4 py-2 font-medium ${order.status==='Cancelled'?'bg-red-light-6 text-red':order.status==='Delivered'?'bg-green-light-6 text-green-dark':'bg-blue-light-5 text-blue-dark'}`}>{order.status}</span></div>
          {order.status === 'Cancelled' ? <div className="mt-7 rounded-md bg-red-light-6 p-5 text-red"><p className="font-medium">This order was cancelled.</p>{order.cancellationReason && <p className="mt-2 text-custom-sm">Reason: {order.cancellationReason}</p>}</div> : <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-5">{stages.map((stage,index) => <div key={stage} className="text-center"><div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium ${index<=currentIndex?'border-blue bg-blue text-white':'border-gray-3 bg-white text-dark-4'}`}>{index+1}</div><div className={`mx-auto mt-2 h-1 max-w-[110px] rounded ${index<=currentIndex?'bg-blue':'bg-gray-3'}`} /><p className="mt-2 text-custom-xs font-medium text-dark sm:text-custom-sm">{stage}</p></div>)}</div>}
          {order.statusHistory.length > 0 && <div className="mt-8"><h3 className="font-medium text-lg text-dark">Status history</h3><div className="mt-4 space-y-3">{order.statusHistory.map((entry) => <div key={entry.id} className="flex gap-3 rounded-md bg-gray-1 p-4"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue"/><div><p className="font-medium text-dark">{entry.newStatus}</p><p className="text-custom-xs text-dark-4">{formatOrderDate(entry.createdAt)}{entry.reason ? ` · ${entry.reason}` : ''}</p></div></div>)}</div></div>}
        </div>
        <div className="grid gap-7.5 lg:grid-cols-3"><div className="rounded-[10px] bg-white p-5 shadow-1 sm:p-7 lg:col-span-2"><h3 className="font-medium text-xl text-dark">Ordered Products</h3><div className="mt-5 space-y-4">{order.items.map((item) => <div key={item.id} className="flex items-center gap-4 rounded-md border border-gray-3 p-3"><div className="relative h-16 w-16 shrink-0"><Image fill sizes="64px" src={getProductImageUrl(item.productImage)} alt={item.productName} className="object-contain"/></div><div className="min-w-0 flex-1"><p className="font-medium text-dark">{item.productName}</p><p className="text-custom-sm text-dark-4">{formatPKR(item.unitPrice)} × {item.quantity}</p></div><p className="font-medium text-dark">{formatPKR(item.lineTotal)}</p></div>)}</div></div><aside className="rounded-[10px] bg-white p-5 shadow-1 sm:p-7"><h3 className="font-medium text-xl text-dark">Summary</h3><div className="mt-5 space-y-3 text-custom-sm"><p className="flex justify-between"><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></p><p className="flex justify-between"><span>Delivery</span><span>{formatPKR(order.deliveryCharge)}</span></p><p className="flex justify-between"><span>Discount</span><span>-{formatPKR(order.discount)}</span></p><p className="flex justify-between border-t border-gray-3 pt-3 text-base font-medium text-dark"><span>Total</span><span>{formatPKR(order.total)}</span></p><p className="pt-2 text-dark-4">Payment: {order.payment?.status || 'Pending'}</p></div></aside></div>
      </div>}
    </div></section>
  </>;
}
