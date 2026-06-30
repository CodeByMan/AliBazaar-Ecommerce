import type { Metadata } from 'next';
import { Suspense } from 'react';
import OrderTracking from '@/components/OrderTracking';

export const metadata: Metadata = {
  title: 'Track Order | AliBazaar',
  description: 'Track your AliBazaar order status and delivery progress.',
};

export default function TrackOrderPage() {
  return <Suspense fallback={<div className="min-h-[420px] bg-gray-2 py-12 text-center sm:py-20">Loading order tracking…</div>}><OrderTracking /></Suspense>;
}
