'use client';

import Breadcrumb from '@/components/Common/Breadcrumb';
import { getSafeRedirect, withRedirect } from '@/lib/auth-redirect';
import { checkUsernameAvailability, signUpCustomer } from '@/lib/api/auth';
import { setAuthenticated } from '@/redux/features/auth-slice';
import { useAppSelector, type AppDispatch } from '@/redux/store';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

type SignupFields = {
  name: string;
  username: string;
  email: string;
  phone: string;
  age: string;
  password: string;
  confirmPassword: string;
};

type SignupErrors = Partial<Record<keyof SignupFields | 'form', string>>;

const initialFields: SignupFields = {
  name: '',
  username: '',
  email: '',
  phone: '',
  age: '',
  password: '',
  confirmPassword: '',
};

const normalizePakistanPhone = (value: string) => {
  const compact = value.replace(/[\s()-]/g, '');
  if (/^03\d{9}$/.test(compact)) return `+92${compact.slice(1)}`;
  return compact;
};

const Signup = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const authStatus = useAppSelector((state) => state.authReducer.status);
  const redirectTo = useMemo(
    () => getSafeRedirect(searchParams.get('redirect'), '/my-account'),
    [searchParams],
  );
  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  useEffect(() => {
    if (authStatus === 'authenticated') router.replace(redirectTo);
  }, [authStatus, redirectTo, router]);

  useEffect(() => {
    const username = fields.username.trim();
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setUsernameStatus('checking');
      checkUsernameAvailability(username)
        .then(({ available }) => {
          if (controller.signal.aborted) return;
          setUsernameStatus(available ? 'available' : 'taken');
          setErrors((current) => ({
            ...current,
            username: available
              ? current.username === 'This username is already taken. Please use another username.'
                ? undefined
                : current.username
              : 'This username is already taken. Please use another username.',
          }));
        })
        .catch(() => {
          if (!controller.signal.aborted) setUsernameStatus('idle');
        });
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [fields.username]);

  const updateField = (field: keyof SignupFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  };

  const validate = () => {
    const nextErrors: SignupErrors = {};
    const normalizedPhone = normalizePakistanPhone(fields.phone);
    const age = Number(fields.age);

    if (fields.name.trim().length < 2) {
      nextErrors.name = 'Enter your full name.';
    }
    if (fields.username.trim().length < 3) {
      nextErrors.username = 'Username must contain at least 3 characters.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!/^\+92\d{10}$/.test(normalizedPhone)) {
      nextErrors.phone = 'Use a valid Pakistan number, for example +923001234567.';
    }
    if (!Number.isInteger(age) || age < 13 || age > 120) {
      nextErrors.age = 'Age must be between 13 and 120.';
    }
    if (fields.password.length < 8) {
      nextErrors.password = 'Password must contain at least 8 characters.';
    }
    if (fields.confirmPassword !== fields.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return { nextErrors, normalizedPhone, age };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const { nextErrors, normalizedPhone, age } = validate();
    if (usernameStatus === 'taken') {
      nextErrors.username = 'This username is already taken. Please use another username.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || usernameStatus === 'checking') return;

    setSubmitting(true);
    try {
      const response = await signUpCustomer({
        name: fields.name.trim(),
        username: fields.username.trim(),
        email: fields.email.trim().toLowerCase(),
        phone: normalizedPhone,
        age,
        password: fields.password,
      });

      if (response.role !== 'user' || !response.user) {
        throw new Error('The customer account could not be initialized.');
      }

      dispatch(setAuthenticated(response.user));
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create your account. Please try again.';
      if (message.toLowerCase().includes('username') && message.toLowerCase().includes('exist')) {
        setUsernameStatus('taken');
        setErrors({ username: 'This username is already taken. Please use another username.' });
      } else {
        setErrors({ form: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof SignupFields) =>
    `w-full rounded-lg border bg-gray-1 px-5 py-3 outline-none duration-200 placeholder:text-dark-5 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
      errors[field] ? 'border-red' : 'border-gray-3'
    }`;

  return (
    <>
      <Breadcrumb title="Signup" pages={['Signup']} />
      <section className="overflow-hidden bg-gray-2 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
          <div className="mx-auto w-full max-w-[680px] rounded-xl bg-white p-4 shadow-1 sm:p-7.5 xl:p-11">
            <div className="mb-8 text-center sm:mb-11">
              <h2 className="mb-1.5 font-semibold text-xl text-dark sm:text-2xl xl:text-heading-5">
                Create a Customer Account
              </h2>
              <p>Public signup creates a customer account only.</p>
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

              <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                <div className="mb-5 sm:col-span-2">
                  <label htmlFor="signup-name" className="mb-2.5 block">
                    Full Name <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    id="signup-name"
                    value={fields.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className={inputClass('name')}
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && (
                    <span className="mt-1.5 block text-custom-xs text-red">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="signup-username" className="mb-2.5 block">
                    Username <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    id="signup-username"
                    value={fields.username}
                    onChange={(event) =>
                      updateField('username', event.target.value)
                    }
                    placeholder="Choose a username"
                    autoComplete="username"
                    className={inputClass('username')}
                    aria-invalid={Boolean(errors.username)}
                  />
                  {errors.username ? (
                    <span className="mt-1.5 block text-custom-xs text-red">
                      {errors.username}
                    </span>
                  ) : usernameStatus === 'checking' ? (
                    <span className="mt-1.5 block text-custom-xs text-dark-4">
                      Checking username availability…
                    </span>
                  ) : usernameStatus === 'available' ? (
                    <span className="mt-1.5 block text-custom-xs text-green">
                      Username is available.
                    </span>
                  ) : null}
                </div>

                <div className="mb-5">
                  <label htmlFor="signup-email" className="mb-2.5 block">
                    Email Address <span className="text-red">*</span>
                  </label>
                  <input
                    type="email"
                    id="signup-email"
                    value={fields.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className={inputClass('email')}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <span className="mt-1.5 block text-custom-xs text-red">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="signup-phone" className="mb-2.5 block">
                    Phone Number <span className="text-red">*</span>
                  </label>
                  <input
                    type="tel"
                    id="signup-phone"
                    value={fields.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="+923001234567"
                    autoComplete="tel"
                    className={inputClass('phone')}
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && (
                    <span className="mt-1.5 block text-custom-xs text-red">
                      {errors.phone}
                    </span>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="signup-age" className="mb-2.5 block">
                    Age <span className="text-red">*</span>
                  </label>
                  <input
                    type="number"
                    id="signup-age"
                    min={13}
                    max={120}
                    value={fields.age}
                    onChange={(event) => updateField('age', event.target.value)}
                    placeholder="18"
                    inputMode="numeric"
                    className={inputClass('age')}
                    aria-invalid={Boolean(errors.age)}
                  />
                  {errors.age && (
                    <span className="mt-1.5 block text-custom-xs text-red">
                      {errors.age}
                    </span>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="signup-password" className="mb-2.5 block">
                    Password <span className="text-red">*</span>
                  </label>
                  <input
                    type="password"
                    id="signup-password"
                    value={fields.password}
                    onChange={(event) =>
                      updateField('password', event.target.value)
                    }
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    className={inputClass('password')}
                    aria-invalid={Boolean(errors.password)}
                  />
                  {errors.password && (
                    <span className="mt-1.5 block text-custom-xs text-red">
                      {errors.password}
                    </span>
                  )}
                </div>

                <div className="mb-5">
                  <label
                    htmlFor="signup-confirm-password"
                    className="mb-2.5 block"
                  >
                    Confirm Password <span className="text-red">*</span>
                  </label>
                  <input
                    type="password"
                    id="signup-confirm-password"
                    value={fields.confirmPassword}
                    onChange={(event) =>
                      updateField('confirmPassword', event.target.value)
                    }
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={inputClass('confirmPassword')}
                    aria-invalid={Boolean(errors.confirmPassword)}
                  />
                  {errors.confirmPassword && (
                    <span className="mt-1.5 block text-custom-xs text-red">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || authStatus === 'loading'}
                className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-dark px-6 py-3 font-medium text-white duration-200 hover:bg-blue disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Creating Account…' : 'Create Customer Account'}
              </button>

              <p className="mt-6 text-center">
                Already have a customer account?
                <Link
                  href={withRedirect('/signin', redirectTo)}
                  className="pl-2 text-dark duration-200 hover:text-blue"
                >
                  Sign In Now
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Signup;
