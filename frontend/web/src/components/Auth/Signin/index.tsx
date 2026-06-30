'use client';

import Breadcrumb from '@/components/Common/Breadcrumb';
import { getSafeRedirect, withRedirect } from '@/lib/auth-redirect';
import { signInCustomer, signOutCustomer } from '@/lib/api/auth';
import { setAuthenticated } from '@/redux/features/auth-slice';
import { useAppSelector, type AppDispatch } from '@/redux/store';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

const Signin = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const authStatus = useAppSelector((state) => state.authReducer.status);
  const redirectTo = useMemo(
    () => getSafeRedirect(searchParams.get('redirect'), '/my-account'),
    [searchParams],
  );
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    form?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated') router.replace(redirectTo);
  }, [authStatus, redirectTo, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: typeof errors = {};
    if (identifier.trim().length < 3) {
      nextErrors.identifier = 'Enter your username or email address.';
    }
    if (password.length < 8) {
      nextErrors.password = 'Password must contain at least 8 characters.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await signInCustomer({
        username: identifier.trim(),
        password,
      });

      if (response.role !== 'user' || !response.user) {
        await signOutCustomer().catch(() => undefined);
        setErrors({
          form: 'Administrator accounts must sign in through the Admin Dashboard.',
        });
        return;
      }

      dispatch(setAuthenticated(response.user));
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : 'Unable to sign in. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-gray-1 px-5 py-3 outline-none duration-200 placeholder:text-dark-5 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
      hasError ? 'border-red' : 'border-gray-3'
    }`;

  return (
    <>
      <Breadcrumb title="Signin" pages={['Signin']} />
      <section className="overflow-hidden bg-gray-2 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
          <div className="mx-auto w-full max-w-[570px] rounded-xl bg-white p-4 shadow-1 sm:p-7.5 xl:p-11">
            <div className="mb-8 text-center sm:mb-11">
              <h2 className="mb-1.5 font-semibold text-xl text-dark sm:text-2xl xl:text-heading-5">
                Sign In to Your Account
              </h2>
              <p>Sign in with your customer username or email.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {errors.form && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-red/20 bg-red-light-6 p-3.5 text-custom-sm text-red"
                >
                  {errors.form}
                </div>
              )}

              <div className="mb-5">
                <label htmlFor="customer-identifier" className="mb-2.5 block">
                  Username or Email <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  name="identifier"
                  id="customer-identifier"
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      identifier: undefined,
                      form: undefined,
                    }));
                  }}
                  placeholder="Enter your username or email"
                  autoComplete="username"
                  aria-invalid={Boolean(errors.identifier)}
                  className={inputClass(Boolean(errors.identifier))}
                />
                {errors.identifier && (
                  <span className="mt-1.5 block text-custom-xs text-red">
                    {errors.identifier}
                  </span>
                )}
              </div>

              <div className="mb-5">
                <label htmlFor="customer-password" className="mb-2.5 block">
                  Password <span className="text-red">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  id="customer-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      password: undefined,
                      form: undefined,
                    }));
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  className={inputClass(Boolean(errors.password))}
                />
                {errors.password && (
                  <span className="mt-1.5 block text-custom-xs text-red">
                    {errors.password}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || authStatus === 'loading'}
                className="mt-7.5 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-dark px-6 py-3 font-medium text-white duration-200 hover:bg-blue disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing In…' : 'Sign In to Account'}
              </button>

              <p className="mt-6 text-center">
                Don&apos;t have a customer account?
                <Link
                  href={withRedirect('/signup', redirectTo)}
                  className="pl-2 text-dark duration-200 hover:text-blue"
                >
                  Sign Up Now
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Signin;
