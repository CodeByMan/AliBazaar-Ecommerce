import React, { useEffect, useMemo, useState } from 'react';
import { api, getApiError } from '../../lib/api';
import { formatPKR } from '../../lib/currency';
import AdminPageShell, {
  Field,
  inputClass,
  primaryButton,
  secondaryButton,
} from './AdminPageShell';

const emptyCoupon = {
  code: '',
  type: 'fixed',
  value: '',
  minimumOrderAmount: '0',
  maximumDiscount: '',
  usageLimit: '',
  perUserLimit: '1',
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

const emptyCompensation = {
  userId: '',
  amount: '',
  sourceOrderId: '',
  reason: '',
  expiresInDays: '60',
};

const toLocalDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyCoupon);
  const [editingId, setEditingId] = useState(null);
  const [compensation, setCompensation] = useState(emptyCompensation);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [couponResponse, userResponse] = await Promise.all([
        api.get('/coupons'),
        api.get('/user'),
      ]);
      setCoupons(Array.isArray(couponResponse.data) ? couponResponse.data : []);
      setUsers(Array.isArray(userResponse.data) ? userResponse.data : []);
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load coupon data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredCoupons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return coupons;
    return coupons.filter((coupon) =>
      [
        coupon.code,
        coupon.kind,
        coupon.type,
        coupon.isActive ? 'active' : 'inactive',
        coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'no expiry',
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [coupons, search]);

  const resetCouponForm = () => {
    setForm(emptyCoupon);
    setEditingId(null);
  };

  const startEdit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(Number(coupon.value)),
      minimumOrderAmount: String(Number(coupon.minimumOrderAmount || 0)),
      maximumDiscount:
        coupon.maximumDiscount === null || coupon.maximumDiscount === undefined
          ? ''
          : String(Number(coupon.maximumDiscount)),
      usageLimit:
        coupon.usageLimit === null || coupon.usageLimit === undefined
          ? ''
          : String(coupon.usageLimit),
      perUserLimit: String(coupon.perUserLimit || 1),
      startsAt: toLocalDateTime(coupon.startsAt),
      expiresAt: toLocalDateTime(coupon.expiresAt),
      isActive: coupon.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (form.type === 'percentage' && Number(form.value) > 100) {
        throw new Error('Percentage discount cannot exceed 100%.');
      }

      const sharedPayload = {
        value: Number(form.value),
        minimumOrderAmount: Number(form.minimumOrderAmount || 0),
        maximumDiscount: form.maximumDiscount
          ? Number(form.maximumDiscount)
          : editingId
            ? null
            : undefined,
        usageLimit: form.usageLimit
          ? Number(form.usageLimit)
          : editingId
            ? null
            : undefined,
        perUserLimit: Number(form.perUserLimit || 1),
        startsAt: form.startsAt
          ? new Date(form.startsAt).toISOString()
          : editingId
            ? null
            : undefined,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : editingId
            ? null
            : undefined,
      };

      if (editingId) {
        await api.patch(`/coupons/${editingId}`, {
          ...sharedPayload,
          isActive: form.isActive,
        });
        setMessage(`Coupon ${form.code} updated successfully.`);
      } else {
        const { data } = await api.post('/coupons', {
          code: form.code || undefined,
          type: form.type,
          ...sharedPayload,
        });
        setMessage(`Coupon ${data.code} created successfully.`);
      }

      resetCouponForm();
      await load();
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to save coupon'));
    } finally {
      setSaving(false);
    }
  };

  const createCompensation = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/coupons/compensation', {
        userId: Number(compensation.userId),
        amount: Number(compensation.amount),
        sourceOrderId: compensation.sourceOrderId
          ? Number(compensation.sourceOrderId)
          : undefined,
        reason: compensation.reason.trim(),
        expiresInDays: Number(compensation.expiresInDays || 60),
      });
      setMessage(`Compensation coupon ${data.coupon.code} assigned.`);
      setCompensation(emptyCompensation);
      await load();
    } catch (requestError) {
      setError(
        getApiError(requestError, 'Unable to create compensation coupon'),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (coupon) => {
    setError('');
    try {
      await api.patch(`/coupons/${coupon.id}`, {
        isActive: !coupon.isActive,
      });
      await load();
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to update coupon status'));
    }
  };

  const deleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete or disable coupon ${coupon.code}?`)) return;
    setError('');
    try {
      const { data } = await api.delete(`/coupons/${coupon.id}`);
      setMessage(data.message || 'Coupon removed successfully.');
      if (editingId === coupon.id) resetCouponForm();
      await load();
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to remove coupon'));
    }
  };

  const customerUsers = users.filter(
    (user) => (user.role || user.auth?.role) === 'user' && user.id,
  );

  return (
    <AdminPageShell
      title="Coupons"
      subtitle="Create discounts, edit coupon rules, and assign private compensation credit to customers."
    >
      {message && (
        <div className="mb-5 rounded-xl bg-green-50 p-4 text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-w-0 gap-5 lg:gap-7 xl:grid-cols-2">
        <form
          onSubmit={submitCoupon}
          className="min-w-0 rounded-2xl bg-white p-4 shadow-lg sm:p-6"
        >
          <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Discount Coupon' : 'Discount Coupon'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {editingId
                  ? 'Code and discount type stay fixed after creation.'
                  : 'Leave the code blank to generate one automatically.'}
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetCouponForm}
                className={secondaryButton}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Code (blank = auto)">
              <input
                className={inputClass}
                value={form.code}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                disabled={Boolean(editingId)}
                minLength={4}
              />
            </Field>
            <Field label="Type">
              <select
                className={inputClass}
                value={form.type}
                onChange={(event) =>
                  setForm((value) => ({ ...value, type: event.target.value }))
                }
                disabled={Boolean(editingId)}
              >
                <option value="fixed">Fixed PKR</option>
                <option value="percentage">Percentage</option>
              </select>
            </Field>
            <Field label="Value *">
              <input
                type="number"
                min="0.01"
                max={form.type === 'percentage' ? '100' : undefined}
                step="0.01"
                className={inputClass}
                value={form.value}
                onChange={(event) =>
                  setForm((value) => ({ ...value, value: event.target.value }))
                }
                required
              />
            </Field>
            <Field label="Minimum order">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.minimumOrderAmount}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    minimumOrderAmount: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Maximum discount">
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={inputClass}
                value={form.maximumDiscount}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    maximumDiscount: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Usage limit">
              <input
                type="number"
                min="1"
                className={inputClass}
                value={form.usageLimit}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    usageLimit: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Per-user limit">
              <input
                type="number"
                min="1"
                max="100"
                className={inputClass}
                value={form.perUserLimit}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    perUserLimit: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Starts at">
              <input
                type="datetime-local"
                className={inputClass}
                value={form.startsAt}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    startsAt: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Expires at">
              <input
                type="datetime-local"
                className={inputClass}
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    expiresAt: event.target.value,
                  }))
                }
              />
            </Field>
            {editingId && (
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Coupon active
              </label>
            )}
          </div>
          <button disabled={saving} className={`${primaryButton} mt-6`}>
            {saving
              ? 'Saving…'
              : editingId
                ? 'Update Coupon'
                : 'Create Discount Coupon'}
          </button>
        </form>

        <form
          onSubmit={createCompensation}
          className="min-w-0 rounded-2xl bg-white p-4 shadow-lg sm:p-6"
        >
          <h2 className="text-xl font-semibold">Compensation Coupon</h2>
          <p className="mt-2 text-sm text-gray-500">
            Generate single-use store credit for one customer.
          </p>
          <div className="mt-5 space-y-4">
            <Field label="Customer *">
              <select
                className={inputClass}
                value={compensation.userId}
                onChange={(event) =>
                  setCompensation((value) => ({
                    ...value,
                    userId: event.target.value,
                  }))
                }
                required
              >
                <option value="">Select customer</option>
                {customerUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.email}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (PKR) *">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className={inputClass}
                  value={compensation.amount}
                  onChange={(event) =>
                    setCompensation((value) => ({
                      ...value,
                      amount: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="Expires in days">
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={compensation.expiresInDays}
                  onChange={(event) =>
                    setCompensation((value) => ({
                      ...value,
                      expiresInDays: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Source order database ID (optional)">
              <input
                type="number"
                min="1"
                className={inputClass}
                value={compensation.sourceOrderId}
                onChange={(event) =>
                  setCompensation((value) => ({
                    ...value,
                    sourceOrderId: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Reason *">
              <textarea
                rows="4"
                maxLength="500"
                className={inputClass}
                value={compensation.reason}
                onChange={(event) =>
                  setCompensation((value) => ({
                    ...value,
                    reason: event.target.value,
                  }))
                }
                required
              />
            </Field>
          </div>
          <button disabled={saving} className={`${primaryButton} mt-6`}>
            {saving ? 'Generating…' : 'Generate & Assign Coupon'}
          </button>
        </form>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="border-b border-gray-100 p-4 sm:p-5">
          <label htmlFor="coupon-search" className="mb-2 block text-sm font-semibold text-gray-700">Search coupons</label>
          <input
            id="coupon-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by code, kind, type, status, or expiry…"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <p className="mt-2 text-xs text-gray-500">Showing {filteredCoupons.length} of {coupons.length} coupons.</p>
        </div>
        <div className="responsive-table-scroll">
          <table className="responsive-table w-full">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Kind</th>
                <th className="px-5 py-4">Value</th>
                <th className="px-5 py-4">Usage</th>
                <th className="px-5 py-4">Expires</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td data-full="true" colSpan="7" className="p-10 text-center">
                    Loading…
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td data-full="true" colSpan="7" className="p-10 text-center text-gray-500">
                    {search ? 'No coupons match your search.' : 'No coupons created yet.'}
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td data-label="Code" className="break-all px-5 py-4 font-semibold text-blue-700">
                      {coupon.code}
                    </td>
                    <td data-label="Kind" className="px-5 py-4 capitalize">{coupon.kind}</td>
                    <td data-label="Value" className="px-5 py-4">
                      {coupon.type === 'percentage'
                        ? `${Number(coupon.value)}%`
                        : formatPKR(Number(coupon.value))}
                    </td>
                    <td data-label="Usage" className="px-5 py-4 text-sm">
                      {coupon.usedCount}/{coupon.usageLimit || '∞'}
                    </td>
                    <td data-label="Expires" className="px-5 py-4 text-sm">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString()
                        : 'No expiry'}
                    </td>
                    <td data-label="Status" className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => toggleCoupon(coupon)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td data-label="Actions" className="px-5 py-4">
                      <div className="responsive-table-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(coupon)}
                          className="rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCoupon(coupon)}
                          className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
