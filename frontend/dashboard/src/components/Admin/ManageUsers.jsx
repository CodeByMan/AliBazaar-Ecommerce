import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getApiError } from '../../lib/api';
import AdminPageShell, { Field, inputClass, primaryButton } from './AdminPageShell';

export default function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/user', { params: { search: search || undefined } });
      setUsers(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load users'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 350);
    return () => clearTimeout(timer);
  }, [load]);

  const remove = async (user) => {
    if (!confirm(`Delete or archive ${user.name}?`)) return;
    try {
      const { data } = await api.delete(`/user/admin/${user.id}`);
      setMessage(data.message || 'User deleted successfully.');
      load();
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to delete user'));
    }
  };

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.isActive ?? user.auth?.isActive).length,
    customers: users.filter((user) => (user.role || user.auth?.role) === 'user').length,
  }), [users]);

  return (
    <AdminPageShell
      title="Users"
      subtitle="Create and manage customers, employees, managers, riders, and other role-based accounts."
      actions={<button onClick={() => navigate('/admin-users-add')} className={primaryButton}>Add User</button>}
    >
      {message && <div className="mb-5 break-words rounded-xl bg-green-50 p-4 text-green-700">{message}</div>}
      {error && <div className="mb-5 break-words rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[['Total users', stats.total], ['Active accounts', stats.active], ['Customers', stats.customers]].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-2xl bg-white p-4 shadow-lg sm:p-5">
            <p className="break-words text-sm text-gray-500">{label}</p>
            <p className="mt-1 break-words text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-lg sm:p-5">
        <Field label="Search users">
          <input
            className={`${inputClass} max-w-xl`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, username, or email"
          />
        </Field>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="responsive-table-scroll">
          <table className="responsive-table w-full">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td data-full="true" colSpan="5" className="p-10 text-center">Loading…</td></tr>
              ) : users.length ? users.map((user) => {
                const role = user.role || user.auth?.role;
                const active = user.isActive ?? user.auth?.isActive;
                return (
                  <tr key={user.id}>
                    <td data-label="User" className="px-5 py-4">
                      <p className="break-words font-semibold">{user.name}</p>
                      <p className="break-all text-sm text-gray-500">@{user.username || user.auth?.username}</p>
                    </td>
                    <td data-label="Contact" className="px-5 py-4">
                      <p className="break-all text-sm">{user.email}</p>
                      <p className="break-words text-sm text-gray-500">{user.phone}</p>
                    </td>
                    <td data-label="Role" className="px-5 py-4">
                      <span className="inline-flex max-w-full break-words rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold capitalize text-purple-700">{role}</span>
                    </td>
                    <td data-label="Status" className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{active ? 'Active' : 'Disabled'}</span>
                    </td>
                    <td data-label="Actions" className="px-5 py-4">
                      {role === 'admin' ? (
                        <span className="break-words text-sm font-medium text-gray-500">Seeded administrator</span>
                      ) : (
                        <div className="responsive-table-actions">
                          <button onClick={() => navigate(`/admin-users-edit/${user.id}`)} className="rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-700">Edit</button>
                          <button onClick={() => remove(user)} className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td data-full="true" colSpan="5" className="p-10 text-center text-gray-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
