'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Breadcrumb from '../Common/Breadcrumb';
import Orders from '../Orders';
import { changeCustomerPassword, signOutCustomer, updateCustomerProfile, updateCustomerProfileImage } from '@/lib/api/auth';
import { getMyCoupons, type CustomerCoupon } from '@/lib/api/commerce';
import { getProductImageUrl } from '@/lib/api/products';
import { formatOrderDate, formatPKR } from '@/lib/currency';
import { withRedirect } from '@/lib/auth-redirect';
import { setAuthenticated, setGuest } from '@/redux/features/auth-slice';
import { removeAllItemsFromCart } from '@/redux/features/cart-slice';
import { removeAllItemsFromWishlist } from '@/redux/features/wishlist-slice';
import { useAppSelector, type AppDispatch } from '@/redux/store';

type Tab = 'dashboard' | 'orders' | 'coupons' | 'account';
const navItems: Array<{ key: Tab; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Orders' },
  { key: 'coupons', label: 'My Coupons' },
  { key: 'account', label: 'Account Details' },
];

export default function MyAccount() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authStatus = useAppSelector((state) => state.authReducer.status);
  const authUser = useAppSelector((state) => state.authReducer.user);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [coupons, setCoupons] = useState<CustomerCoupon[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({ name: '', username: '', email: '', phone: '', age: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'guest') router.replace(withRedirect('/signin', '/my-account'));
  }, [authStatus, router]);
  useEffect(() => {
    if (!authUser) return;
    setProfile({ name: authUser.name, username: authUser.username, email: authUser.email, phone: authUser.phone, age: String(authUser.age) });
  }, [authUser]);
  useEffect(() => {
    if (activeTab !== 'coupons' || coupons.length) return;
    setCouponLoading(true);
    getMyCoupons().then(setCoupons).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load coupons.')).finally(() => setCouponLoading(false));
  }, [activeTab, coupons.length]);

  const logout = async () => {
    await signOutCustomer().catch(() => undefined);
    dispatch(removeAllItemsFromCart());
    dispatch(removeAllItemsFromWishlist());
    dispatch(setGuest());
    router.replace('/signin');
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const updated = await updateCustomerProfile({ ...profile, age: Number(profile.age) });
      dispatch(setAuthenticated(updated)); setMessage('Profile updated successfully.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Profile could not be updated.'); }
    finally { setSaving(false); }
  };
  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (passwords.newPassword !== passwords.confirmPassword) return setError('New passwords do not match.');
    setSaving(true);
    try {
      const result = await changeCustomerPassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setMessage(result.message); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { setError(e instanceof Error ? e.message : 'Password could not be changed.'); }
    finally { setSaving(false); }
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Profile image must be JPEG, PNG, or WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    setError('');
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const saveProfileImage = async () => {
    if (!profileImageFile) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateCustomerProfileImage(profileImageFile);
      dispatch(setAuthenticated(updated));
      setProfileImageFile(null);
      setMessage('Profile image updated successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Profile image could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const profileImageUrl = profileImagePreview || (authUser?.profileImage ? getProductImageUrl(authUser.profileImage) : '/images/users/user-01.jpg');

  if (authStatus !== 'authenticated' || !authUser) return <div className="min-h-[420px] bg-gray-2 py-12 text-center sm:py-20">{authStatus === 'loading' ? 'Loading your account…' : 'Redirecting to sign in…'}</div>;

  const inputClass = 'w-full rounded-md border border-gray-3 bg-gray-1 px-4 py-3 outline-none focus:border-blue';

  return <>
    <Breadcrumb title="My Account" pages={['my account']} />
    <section className="overflow-hidden bg-gray-2 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
        <div className="flex flex-col gap-7.5 xl:flex-row">
          <aside className="w-full xl:max-w-[270px]"><div className="rounded-xl bg-white p-4 shadow-1">
            <div className="border-b border-gray-3 px-2 pb-4"><p className="font-medium text-dark">{authUser.name}</p><p className="mt-1 truncate text-custom-sm text-dark-4">@{authUser.username}</p></div>
            <nav className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{navItems.map((item) => <button key={item.key} onClick={() => {setActiveTab(item.key);setMessage('');setError('');}} className={`rounded-md px-4 py-3 text-left font-medium duration-200 ${activeTab === item.key ? 'bg-blue text-white' : 'bg-gray-1 text-dark hover:bg-blue hover:text-white'}`}>{item.label}</button>)}
              <button onClick={logout} className="rounded-md bg-gray-1 px-4 py-3 text-left font-medium text-red hover:bg-red hover:text-white">Logout</button></nav>
          </div></aside>

          <div className="min-w-0 flex-1">
            {message && <p className="mb-5 rounded-md bg-green-light-6 p-4 text-green-dark">{message}</p>}
            {error && <p className="mb-5 rounded-md bg-red-light-6 p-4 text-red">{error}</p>}

            {activeTab === 'dashboard' && <div className="rounded-xl bg-white p-5 shadow-1 sm:p-8">
              <h1 className="font-medium text-2xl text-dark">Welcome back, {authUser.name.split(' ')[0]}</h1>
              <p className="mt-3 text-dark-4">Manage your orders, compensation coupons, reviews, and account details from this customer dashboard.</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-3"><button onClick={() => setActiveTab('orders')} className="rounded-lg border border-gray-3 p-5 text-left hover:border-blue"><p className="font-medium text-dark">My Orders</p><p className="mt-1 text-custom-sm text-dark-4">Track delivery and review delivered products</p></button><button onClick={() => setActiveTab('coupons')} className="rounded-lg border border-gray-3 p-5 text-left hover:border-blue"><p className="font-medium text-dark">My Coupons</p><p className="mt-1 text-custom-sm text-dark-4">View compensation and assigned discounts</p></button><button onClick={() => setActiveTab('account')} className="rounded-lg border border-gray-3 p-5 text-left hover:border-blue"><p className="font-medium text-dark">Account Details</p><p className="mt-1 text-custom-sm text-dark-4">Update profile and password</p></button></div>
            </div>}

            {activeTab === 'orders' && <div className="rounded-xl bg-white shadow-1"><div className="border-b border-gray-3 px-5 py-5 sm:px-7"><h2 className="font-medium text-xl text-dark">Order History</h2></div><Orders /></div>}

            {activeTab === 'coupons' && <div className="rounded-xl bg-white p-5 shadow-1 sm:p-8"><h2 className="font-medium text-xl text-dark">My Coupons</h2><p className="mt-2 text-custom-sm text-dark-4">Assigned compensation coupons can be used during checkout.</p>
              {couponLoading ? <p className="mt-6 text-dark-4">Loading coupons…</p> : coupons.length === 0 ? <p className="mt-6 rounded-md bg-gray-1 p-5 text-dark-4">No coupons are assigned to your account.</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2">{coupons.map((coupon) => <article key={coupon.id} className="rounded-lg border border-gray-3 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><code className="rounded bg-blue-light-5 px-3 py-1 font-medium text-blue-dark">{coupon.code}</code><span className={`rounded-full px-3 py-1 text-custom-xs ${coupon.usedAt || !coupon.isActive ? 'bg-gray-2 text-dark-4' : 'bg-green-light-6 text-green-dark'}`}>{coupon.usedAt ? 'Used' : coupon.isActive ? 'Available' : 'Inactive'}</span></div><p className="mt-4 font-medium text-dark">{coupon.type === 'percentage' ? `${coupon.value}% discount` : formatPKR(coupon.value)}</p>{coupon.reason && <p className="mt-2 text-custom-sm text-dark-4">{coupon.reason}</p>}<div className="mt-4 text-custom-xs text-dark-4"><p>Minimum order: {formatPKR(coupon.minimumOrderAmount)}</p><p>Expires: {coupon.expiresAt ? formatOrderDate(coupon.expiresAt) : 'No expiry'}</p>{coupon.sourceOrderNumber && <p>From order: {coupon.sourceOrderNumber}</p>}</div></article>)}</div>}
            </div>}

            {activeTab === 'account' && <div className="space-y-6">
              <div className="rounded-xl bg-white p-5 shadow-1 sm:p-8">
                <h2 className="font-medium text-xl text-dark">Profile Image</h2>
                <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <Image src={profileImageUrl} alt={authUser.name} width={96} height={96} className="h-24 w-24 rounded-full object-cover ring-2 ring-gray-3" />
                  <div className="flex-1">
                    <p className="text-custom-sm text-dark-4">Upload a JPEG, PNG, or WebP image up to 5 MB. A default avatar is used until you upload one.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer rounded-md bg-gray-1 px-5 py-3 font-medium text-dark hover:bg-gray-2">
                        Choose Image
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfileImageChange} className="hidden" />
                      </label>
                      <button type="button" onClick={saveProfileImage} disabled={!profileImageFile || saving} className="rounded-md bg-blue px-5 py-3 font-medium text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Uploading…' : 'Upload Image'}</button>
                    </div>
                  </div>
                </div>
              </div>
              <form onSubmit={saveProfile} className="rounded-xl bg-white p-5 shadow-1 sm:p-8"><h2 className="font-medium text-xl text-dark">Account Details</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">{(['name','username','email','phone','age'] as const).map((field) => <label key={field}><span className="mb-2 block capitalize">{field}</span><input type={field === 'email' ? 'email' : field === 'age' ? 'number' : 'text'} value={profile[field]} onChange={(e) => setProfile((v) => ({...v,[field]:e.target.value}))} className={inputClass} required /></label>)}</div><button disabled={saving} className="mt-6 rounded-md bg-blue px-6 py-3 font-medium text-white hover:bg-blue-dark disabled:opacity-50">{saving ? 'Saving…' : 'Save Profile'}</button></form>
              <form onSubmit={changePassword} className="rounded-xl bg-white p-5 shadow-1 sm:p-8"><h2 className="font-medium text-xl text-dark">Change Password</h2><div className="mt-6 grid gap-5 sm:grid-cols-3">{(['currentPassword','newPassword','confirmPassword'] as const).map((field) => <label key={field}><span className="mb-2 block">{field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm Password'}</span><input type="password" value={passwords[field]} onChange={(e) => setPasswords((v) => ({...v,[field]:e.target.value}))} className={inputClass} minLength={8} required /></label>)}</div><button disabled={saving} className="mt-6 rounded-md bg-dark px-6 py-3 font-medium text-white hover:bg-blue disabled:opacity-50">{saving ? 'Updating…' : 'Change Password'}</button></form>
            </div>}
          </div>
        </div>
      </div>
    </section>
  </>;
}
