import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getApiError } from '../../lib/api';
import AdminPageShell, { Field, inputClass, primaryButton, secondaryButton } from './AdminPageShell';
const empty = { name: '', description: '', isActive: true };
export default function AdminRoleForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [systemRole, setSystemRole] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => { if (!editing) return; setLoading(true); try { const { data } = await api.get('/roles'); const role = (Array.isArray(data) ? data : []).find((item) => String(item.id) === String(id)); if (!role) throw new Error('Role not found.'); setSystemRole(Boolean(role.isSystem)); setForm({ name: role.name, description: role.description || '', isActive: role.isActive }); } catch (requestError) { setError(getApiError(requestError, 'Unable to load role')); } finally { setLoading(false); } }, [editing, id]);
  useEffect(() => { load(); }, [load]);
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); try { if (editing) await api.patch(`/roles/${id}`, form); else await api.post('/roles', { name: form.name, description: form.description || undefined }); navigate('/admin-roles'); } catch (requestError) { setError(getApiError(requestError, 'Unable to save role')); } finally { setSaving(false); } };
  return <AdminPageShell title={editing ? 'Edit Role' : 'Add Role'} subtitle={editing ? 'Update role information and status.' : 'Create a new assignable dashboard role.'} actions={<button type="button" onClick={() => navigate('/admin-roles')} className={secondaryButton}>← Back to Roles</button>}>
    {error && <div className="mb-5 break-words rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
    {loading ? <div className="rounded-2xl bg-white p-6 text-center shadow-lg sm:p-10">Loading…</div> : <form onSubmit={submit} className="w-full max-w-2xl min-w-0 rounded-2xl bg-white p-4 shadow-lg sm:p-8"><div className="space-y-4"><Field label="Role name *"><input className={inputClass} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value.toLowerCase() }))} placeholder="manager" required disabled={systemRole} /></Field><Field label="Description"><textarea className={inputClass} rows="4" value={form.description || ''} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></Field>{editing && <label className="flex gap-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} />Active</label>}</div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button disabled={saving || systemRole} className={primaryButton}>{saving ? 'Saving…' : editing ? 'Update Role' : 'Create Role'}</button><button type="button" className={secondaryButton} onClick={() => navigate('/admin-roles')}>Cancel</button></div></form>}
  </AdminPageShell>;
}
