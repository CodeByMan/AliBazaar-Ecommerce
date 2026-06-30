import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getApiError } from '../../lib/api';
import AdminPageShell, { primaryButton } from './AdminPageShell';

export default function ManageRoles() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/roles')
      .then((response) => setRoles(Array.isArray(response.data) ? response.data : []))
      .catch((requestError) => setError(getApiError(requestError)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) =>
      [role.name, role.description, role.isSystem ? 'system' : role.isActive ? 'active' : 'inactive']
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [roles, search]);

  const remove = async (role) => {
    if (!confirm(`Delete role ${role.name}?`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      load();
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to delete role'));
    }
  };

  return (
    <AdminPageShell
      title="Roles"
      subtitle="Create employee, manager, rider, and other assignable roles. System roles remain protected."
      actions={<button onClick={() => navigate('/admin-roles-add')} className={primaryButton}>Add Role</button>}
    >
      {error && <div className="mb-5 break-words rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-5">
        <label htmlFor="role-search" className="mb-2 block text-sm font-semibold text-gray-700">Search roles</label>
        <input
          id="role-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by role name, description, or status…"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="mt-2 text-xs text-gray-500">Showing {filteredRoles.length} of {roles.length} roles.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-lg sm:p-10">Loading…</div>
      ) : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRoles.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 shadow-sm">
              No roles match your search.
            </div>
          ) : filteredRoles.map((role) => (
            <article key={role.id} className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-5">
              <div className="flex min-w-0 flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-lg font-semibold capitalize">{role.name}</h3>
                  <p className="mt-1 break-words text-sm text-gray-500">{role.description || 'No description'}</p>
                </div>
                <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs ${role.isSystem ? 'bg-purple-100 text-purple-700' : role.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {role.isSystem ? 'System' : role.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                <button
                  onClick={() => navigate(`/admin-roles-edit/${role.id}`)}
                  className="w-full rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={role.isSystem}
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(role)}
                  className="w-full rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={role.isSystem}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
