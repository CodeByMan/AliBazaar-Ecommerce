import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getApiError, resolveImageUrl } from '../../lib/api';
import { formatDateTime, formatPKR } from '../../lib/currency';
import AdminPageShell from './AdminPageShell';

const ORDER_STATUSES = ['', 'Pending', 'Dispatched', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['', 'Pending', 'Succeeded', 'Failed', 'Refunded'];

const statusClass = (status) => ({
  Pending: 'bg-amber-100 text-amber-800',
  Dispatched: 'bg-indigo-100 text-indigo-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
}[status] || 'bg-gray-100 text-gray-700');

const MobileLabel = ({ children }) => (
  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400 lg:hidden">{children}</span>
);

const ManageOrders = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('orderId') || '';
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: initialSearch, status: '', paymentStatus: '' });
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch.trim());
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(pagination.page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filters.status) params.set('status', filters.status);
    if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    return params.toString();
  }, [debouncedSearch, filters.status, filters.paymentStatus, pagination.page]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/orders/admin/list?${query}`);
      setOrders(data.data || []);
      setPagination((current) => ({ ...current, ...data.pagination }));
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load orders'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    setPagination((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch, filters.status, filters.paymentStatus]);

  const openOrder = async (orderNumber) => {
    setDetailLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/orders/admin/${encodeURIComponent(orderNumber)}`);
      setSelected(data);
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load order details'));
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (status) => {
    if (!selected || updating) return;
    let reason;
    if (status === 'Cancelled') {
      reason = window.prompt('Enter the required cancellation reason:')?.trim();
      if (!reason) { setError('Cancellation reason is required.'); return; }
    }
    setUpdating(true);
    setError('');
    try {
      const { data } = await api.patch(`/orders/admin/${encodeURIComponent(selected.orderNumber)}/status`, { status, reason });
      setSelected(data);
      await loadOrders();
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to update order status'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminPageShell title="Orders" subtitle={`${pagination.total} total orders`}>
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-3">
          <label className="min-w-0 text-sm font-medium">Search
            <input
              value={filters.search}
              onChange={(e) => setFilters((v) => ({ ...v, search: e.target.value }))}
              placeholder="Order ID, name, email, phone"
              className="mt-1 block w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500"
            />
          </label>
          <label className="min-w-0 text-sm font-medium">Order status
            <select
              value={filters.status}
              onChange={(e) => setFilters((v) => ({ ...v, status: e.target.value }))}
              className="mt-1 block w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-500"
            >
              {ORDER_STATUSES.map((value) => <option key={value || 'all'} value={value}>{value || 'All statuses'}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-sm font-medium sm:col-span-2 lg:col-span-1">Payment status
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters((v) => ({ ...v, paymentStatus: e.target.value }))}
              className="mt-1 block w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-500"
            >
              {PAYMENT_STATUSES.map((value) => <option key={value || 'all'} value={value}>{value || 'All payments'}</option>)}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="mb-5 break-words rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_auto] gap-4 border-b bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:grid">
          <span>Order</span><span>Customer</span><span>Date</span><span>Status</span><span>Total</span><span>Action</span>
        </div>
        {loading ? (
          <div className="px-4 py-12 text-center text-gray-500">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">No orders match these filters.</div>
        ) : orders.map((order) => (
          <div
            key={order.id}
            className="grid min-w-0 gap-4 border-b border-gray-100 px-4 py-5 last:border-0 sm:grid-cols-2 sm:px-5 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_auto] lg:items-center lg:gap-4"
          >
            <div className="min-w-0">
              <MobileLabel>Order</MobileLabel>
              <p className="break-all font-semibold text-blue-700">{order.orderNumber}</p>
              <p className="text-xs text-gray-500">{order.items.length} item(s)</p>
            </div>
            <div className="min-w-0">
              <MobileLabel>Customer</MobileLabel>
              <p className="break-words font-medium">{order.customer.fullName}</p>
              <p className="break-all text-xs text-gray-500 lg:truncate">{order.customer.email}</p>
            </div>
            <div className="min-w-0">
              <MobileLabel>Date</MobileLabel>
              <p className="break-words text-sm text-gray-600">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <MobileLabel>Status</MobileLabel>
              <span className={`inline-flex max-w-full break-words rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}>{order.status}</span>
            </div>
            <div>
              <MobileLabel>Total</MobileLabel>
              <p className="break-words font-semibold">{formatPKR(order.total)}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <MobileLabel>Action</MobileLabel>
              <button
                disabled={detailLoading}
                onClick={() => openOrder(order.orderNumber)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 items-center gap-3 sm:flex sm:justify-between sm:gap-4">
        <button
          disabled={pagination.page <= 1 || loading}
          onClick={() => setPagination((v) => ({ ...v, page: v.page - 1 }))}
          className="row-start-2 w-full rounded-lg border px-4 py-2 disabled:opacity-40 sm:row-auto sm:w-auto"
        >
          Previous
        </button>
        <span className="col-span-2 row-start-1 text-center text-sm text-gray-600 sm:order-none sm:col-auto sm:row-auto">Page {pagination.page} of {pagination.totalPages}</span>
        <button
          disabled={pagination.page >= pagination.totalPages || loading}
          onClick={() => setPagination((v) => ({ ...v, page: v.page + 1 }))}
          className="row-start-2 w-full rounded-lg border px-4 py-2 disabled:opacity-40 sm:row-auto sm:w-auto"
        >
          Next
        </button>
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 sm:p-5 lg:p-8"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="mx-auto max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]">
            <div className="sticky top-0 z-10 flex flex-col items-stretch justify-between gap-3 border-b bg-white px-4 py-4 sm:flex-row sm:items-start sm:px-8 sm:py-5">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Order details</p>
                <h2 className="break-all text-xl font-bold sm:text-2xl">{selected.orderNumber}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="w-full rounded-lg border px-4 py-2 sm:w-auto">Close</button>
            </div>

            <div className="grid min-w-0 gap-6 p-4 sm:p-6 lg:grid-cols-3 lg:gap-8 lg:p-8">
              <div className="min-w-0 space-y-6 lg:col-span-2">
                <section>
                  <h3 className="mb-3 font-semibold">Purchased products</h3>
                  <div className="space-y-3">
                    {selected.items.map((item) => (
                      <div key={item.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4">
                        {item.productImage ? (
                          <img src={resolveImageUrl(item.productImage)} alt={item.productName} className="h-14 w-14 rounded-lg object-contain sm:h-16 sm:w-16" />
                        ) : (
                          <div className="h-14 w-14 rounded-lg bg-gray-100 sm:h-16 sm:w-16" />
                        )}
                        <div className="min-w-0">
                          <p className="break-words font-medium">{item.productName}</p>
                          <p className="break-words text-sm text-gray-500">{formatPKR(item.unitPrice)} × {item.quantity}</p>
                        </div>
                        <p className="col-span-2 break-words text-right font-semibold sm:col-span-1">{formatPKR(item.lineTotal)}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <div className="min-w-0 rounded-xl bg-gray-50 p-4">
                    <h3 className="font-semibold">Customer</h3>
                    <p className="mt-2 break-words">{selected.customer.fullName}</p>
                    <p className="break-all text-sm text-gray-600">{selected.customer.email}</p>
                    <p className="break-words text-sm text-gray-600">{selected.customer.phone}</p>
                  </div>
                  <div className="min-w-0 rounded-xl bg-gray-50 p-4">
                    <h3 className="font-semibold">Delivery</h3>
                    <p className="mt-2 break-words text-sm text-gray-700">{selected.delivery.address}, {selected.delivery.city}, {selected.delivery.province} {selected.delivery.postalCode}, {selected.delivery.country}</p>
                    {selected.delivery.notes && <p className="mt-2 break-words text-sm text-gray-500">Notes: {selected.delivery.notes}</p>}
                  </div>
                </section>

                {selected.statusHistory?.length > 0 && (
                  <section>
                    <h3 className="mb-3 font-semibold">Status history</h3>
                    <div className="space-y-3">
                      {selected.statusHistory.map((entry) => (
                        <div key={entry.id} className="flex min-w-0 gap-3 rounded-xl bg-gray-50 p-4">
                          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                          <div className="min-w-0">
                            <p className="break-words font-medium">{entry.newStatus}</p>
                            <p className="break-words text-xs text-gray-500">{formatDateTime(entry.createdAt)}{entry.reason ? ` · ${entry.reason}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="min-w-0 space-y-5">
                <div className="min-w-0 rounded-xl border p-4">
                  <h3 className="font-semibold">Order status</h3>
                  <span className={`mt-3 inline-flex max-w-full break-words rounded-full px-3 py-1 text-sm font-semibold ${statusClass(selected.status)}`}>{selected.status}</span>
                  {selected.cancellationReason && <p className="mt-3 break-words rounded-lg bg-red-50 p-3 text-sm text-red-700"><strong>Reason:</strong> {selected.cancellationReason}</p>}
                  <div className="mt-4 grid gap-2">
                    {selected.availableTransitions.map((status) => (
                      <button
                        key={status}
                        disabled={updating}
                        onClick={() => updateStatus(status)}
                        className={`w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${status === 'Cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {updating ? 'Updating…' : `Mark ${status}`}
                      </button>
                    ))}
                  </div>
                  {selected.availableTransitions.length === 0 && <p className="mt-3 text-xs text-gray-500">This order is in a final state.</p>}
                </div>

                <div className="min-w-0 rounded-xl border p-4">
                  <h3 className="font-semibold">Payment</h3>
                  <p className="mt-2 break-words text-sm">Status: <strong>{selected.payment?.status || 'Pending'}</strong></p>
                  <p className="break-words text-sm">Provider: {selected.payment?.provider || '—'}</p>
                  <p className="break-all text-xs text-gray-500">Reference: {selected.payment?.paymentReference || '—'}</p>
                </div>

                <div className="min-w-0 rounded-xl border p-4">
                  <h3 className="font-semibold">Totals</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="flex min-w-0 justify-between gap-3"><span>Subtotal</span><span className="break-words text-right">{formatPKR(selected.subtotal)}</span></p>
                    <p className="flex min-w-0 justify-between gap-3"><span>Delivery</span><span className="break-words text-right">{formatPKR(selected.deliveryCharge)}</span></p>
                    <p className="flex min-w-0 justify-between gap-3"><span>Discount</span><span className="break-words text-right">-{formatPKR(selected.discount)}</span></p>
                    <p className="flex min-w-0 justify-between gap-3 border-t pt-3 text-base font-bold"><span>Total</span><span className="break-words text-right">{formatPKR(selected.total)}</span></p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
};

export default ManageOrders;
