import Signup from '@/components/Auth/Signup';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Customer Signup | AliBazaar',
  description: 'Create your AliBazaar customer account.',
};

const SignupPage = () => (
  <main>
    <Suspense fallback={<div className="min-h-[420px] bg-gray-2 py-20 text-center">Loading signup…</div>}>
      <Signup />
    </Suspense>
  </main>
);

export default SignupPage;
