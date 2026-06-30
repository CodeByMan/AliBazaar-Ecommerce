import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getApiError, resolveImageUrl } from '../../lib/api';
import AdminPageShell, { Field, inputClass, primaryButton, secondaryButton } from './AdminPageShell';
import { PRODUCT_IMAGE_ACCEPT, validateProductImage } from '../../lib/productForm';

const empty = { name: '', description: '', isActive: true, image: '' };

export default function AdminCategoryForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedPreview = useMemo(() => (image ? URL.createObjectURL(image) : ''), [image]);
  useEffect(() => () => selectedPreview && URL.revokeObjectURL(selectedPreview), [selectedPreview]);

  const load = useCallback(async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const { data } = await api.get('/categories/admin');
      const item = (Array.isArray(data) ? data : []).find((category) => String(category.id) === String(id));
      if (!item) throw new Error('Category not found.');
      setForm({ name: item.name, description: item.description || '', image: item.image || '', isActive: item.isActive });
      setImage(null);
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load category'));
    } finally {
      setLoading(false);
    }
  }, [editing, id]);
  useEffect(() => { load(); }, [load]);

  const handleImage = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    const validationError = validateProductImage(file);
    if (validationError) return setError(validationError.replaceAll('Product', 'Category').replaceAll('product', 'category'));
    setError('');
    setImage(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      if (form.description) payload.append('description', form.description);
      if (editing) payload.append('isActive', String(form.isActive));
      if (image) payload.append('image', image);
      if (editing) await api.patch(`/categories/${id}`, payload);
      else await api.post('/categories', payload);
      navigate('/admin-categories');
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to save category'));
    } finally {
      setSaving(false);
    }
  };

  const preview = selectedPreview || resolveImageUrl(form.image) || '';

  return (
    <AdminPageShell title={editing ? 'Edit Category' : 'Add Category'} subtitle={editing ? 'Update category details and image.' : 'Create a new product category.'} actions={<button type="button" onClick={() => navigate('/admin-categories')} className={secondaryButton}>← Back to Categories</button>}>
      {error && <div className="mb-5 break-words rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      {loading ? <div className="rounded-2xl bg-white p-6 text-center shadow-lg sm:p-10">Loading…</div> : <form onSubmit={submit} className="w-full max-w-3xl min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-8"><div className="space-y-4"><Field label="Name *"><input className={inputClass} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required /></Field><p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">The URL slug is generated automatically from the category name.</p><Field label="Description"><textarea className={inputClass} rows="4" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></Field><Field label="Category Image"><div className="min-w-0 rounded-xl border-2 border-dashed border-gray-300 p-3 text-center sm:p-4">{preview ? <img src={preview} alt="Category preview" className="mx-auto h-36 w-full rounded-lg bg-gray-100 object-contain" /> : <div className="flex h-36 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">A default category image will be used.</div>}<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center"><label className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">{preview ? 'Change Image' : 'Upload Image'}<input type="file" accept={PRODUCT_IMAGE_ACCEPT} onChange={handleImage} className="hidden" /></label>{image && <button type="button" onClick={() => setImage(null)} className="w-full rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 sm:w-auto">Undo</button>}</div><p className="mt-3 break-words text-xs text-gray-500">JPEG, PNG, or WebP up to 5 MB.</p></div></Field>{editing && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} /> Active</label>}</div><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><button disabled={saving} className={primaryButton}>{saving ? 'Saving…' : editing ? 'Update Category' : 'Create Category'}</button><button type="button" onClick={() => navigate('/admin-categories')} className={secondaryButton}>Cancel</button></div></form>}
    </AdminPageShell>
  );
}
