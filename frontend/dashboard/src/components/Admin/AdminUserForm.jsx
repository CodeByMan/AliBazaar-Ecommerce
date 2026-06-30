import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getApiError } from '../../lib/api';
import AdminPageShell, { Field, inputClass, primaryButton, secondaryButton } from './AdminPageShell';

const empty = { username: '', password: '', name: '', email: '', phone: '', age: '18', role: 'user', isActive: true };

export default function AdminUserForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesResponse, usersResponse] = await Promise.all([
        api.get('/roles'),
        editing ? api.get('/user') : Promise.resolve({ data: [] }),
      ]);
      const assignableRoles = (Array.isArray(rolesResponse.data) ? rolesResponse.data : []).filter((role) => role.isActive && role.name !== 'admin');
      setRoles(assignableRoles);
      if (!editing) {
        setForm((value) => ({ ...value, role: assignableRoles.find((role) => role.name === 'user')?.name || assignableRoles[0]?.name || 'user' }));
        return;
      }
      const user = (Array.isArray(usersResponse.data) ? usersResponse.data : []).find((item) => String(item.id) === String(id));
      if (!user) throw new Error('User not found.');
      setForm({ username: user.username || user.auth?.username || '', password: '', name: user.name || user.user?.name || '', email: user.email || user.user?.email || '', phone: user.phone || user.user?.phone || '', age: String(user.age || user.user?.age || 18), role: user.role || user.auth?.role || 'user', isActive: user.isActive ?? user.auth?.isActive ?? true });
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load user form'));
    } finally {
      setLoading(false);
    }
  }, [editing, id]);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { username: form.username, name: form.name, email: form.email, phone: form.phone, age: Number(form.age), role: form.role, ...(form.password ? { password: form.password } : {}), ...(editing ? { isActive: form.isActive } : {}) };
      if (editing) await api.patch(`/user/admin/${id}`, payload);
      else await api.post('/user/admin', payload);
      navigate('/admin-users');
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to save user'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell title={editing ? 'Edit User' : 'Add User'} subtitle={editing ? 'Update account information and role.' : 'Create a new dashboard or customer account.'} actions={<button type="button" onClick={() => navigate('/admin-users')} className={secondaryButton}>← Back to Users</button>}>
      {error && <div className="mb-5 break-words rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
      {loading ? <div className="rounded-2xl bg-white p-6 text-center shadow-lg sm:p-10">Loading…</div> : <form onSubmit={submit} className="w-full max-w-3xl min-w-0 rounded-2xl bg-white p-4 shadow-lg sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name *"><input className={inputClass} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required /></Field><Field label="Username *"><input className={inputClass} value={form.username} onChange={(event) => setForm((value) => ({ ...value, username: event.target.value }))} required /></Field><Field label="Email *"><input type="email" className={inputClass} value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} required /></Field><Field label="Phone *"><input className={inputClass} value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} required /></Field><Field label="Age *"><input type="number" min="16" max="100" className={inputClass} value={form.age} onChange={(event) => setForm((value) => ({ ...value, age: event.target.value }))} required /></Field><Field label="Role *"><select className={inputClass} value={form.role} onChange={(event) => setForm((value) => ({ ...value, role: event.target.value }))} required>{roles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}</select></Field><Field label={editing ? 'New password (optional)' : 'Password *'} className="sm:col-span-2"><input type="password" minLength="8" className={inputClass} value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} required={!editing} /></Field>{editing && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} />Account active</label>}</div><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><button disabled={saving} className={primaryButton}>{saving ? 'Saving…' : editing ? 'Update User' : 'Create User'}</button><button type="button" onClick={() => navigate('/admin-users')} className={secondaryButton}>Cancel</button></div></form>}
    </AdminPageShell>
  );
}
