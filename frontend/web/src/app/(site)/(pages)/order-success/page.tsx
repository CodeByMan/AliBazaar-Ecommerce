import type { Metadata } from 'next';
import { Suspense } from 'react';
import OrderSuccess from '@/components/OrderSuccess';

export const metadata: Metadata = {
  title: 'Order Confirmed | AliBazaar',
  description: 'Your AliBazaar order has been confirmed.',
};

export default function OrderSuccessPage() {
  return <Suspense fallback={<div className="min-h-[420px] bg-gray-2 py-12 text-center sm:py-20">Loading order…</div>}><OrderSuccess /></Suspense>;
}
