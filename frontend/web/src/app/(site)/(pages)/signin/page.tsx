import Signin from '@/components/Auth/Signin';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Customer Sign In | AliBazaar',
  description: 'Sign in to your AliBazaar customer account.',
};

const SigninPage = () => (
  <main>
    <Suspense fallback={<div className="min-h-[420px] bg-gray-2 py-20 text-center">Loading sign in…</div>}>
      <Signin />
    </Suspense>
  </main>
);

export default SigninPage;
