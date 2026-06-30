import type { Metadata } from 'next';
import { Suspense } from 'react';
import PaymentReturn from '@/components/PaymentReturn';

export const metadata: Metadata = {
  title: 'Verifying Payment | AliBazaar',
  description: 'AliBazaar is verifying your Stripe payment.',
};

export default function PaymentReturnPage() {
  return <Suspense fallback={<div className="min-h-[420px] bg-gray-2 py-12 text-center sm:py-20">Verifying payment…</div>}><PaymentReturn /></Suspense>;
}
