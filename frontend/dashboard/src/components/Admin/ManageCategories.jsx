import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getApiError, resolveImageUrl } from '../../lib/api';
import AdminPageShell, { primaryButton } from './AdminPageShell';

export default function ManageCategories() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/categories/admin')
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch((requestError) => setError(getApiError(requestError, 'Unable to load categories')))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.name, item.slug, item.description, item.isActive ? 'active' : 'inactive']
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [items, search]);

  const remove = async (item) => {
    if (!confirm(`Delete category ${item.name}?`)) return;
    try {
      await api.delete(`/categories/${item.id}`);
      load();
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to delete category'));
    }
  };

  return (
    <AdminPageShell
      title="Categories"
      subtitle="Create and maintain the categories used by AliBazaar products."
      actions={<button onClick={() => navigate('/admin-categories-add')} className={primaryButton}>Add Category</button>}
    >
      {error && <div className="mb-5 break-words rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-5">
        <label htmlFor="category-search" className="mb-2 block text-sm font-semibold text-gray-700">Search categories</label>
        <input
          id="category-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, slug, description, or status…"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="mt-2 text-xs text-gray-500">Showing {filteredItems.length} of {items.length} categories.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
        <div className="responsive-table-scroll">
          <table className="responsive-table w-full">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Image</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Slug</th>
                <th className="px-5 py-4">Products</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td data-full="true" colSpan="6" className="p-10 text-center">Loading…</td></tr>
              ) : filteredItems.length ? filteredItems.map((item) => (
                <tr key={item.id}>
                  <td data-label="Image" className="px-5 py-4">
                    <img
                      src={resolveImageUrl(item.image || 'defaults/category-placeholder.svg')}
                      alt={item.name}
                      className="h-14 w-16 rounded-lg bg-gray-100 object-contain"
                    />
                  </td>
                  <td data-label="Category" className="px-5 py-4">
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{item.name}</p>
                      <p className="max-w-xs break-words text-sm text-gray-500 md:truncate">{item.description || 'No description'}</p>
                    </div>
                  </td>
                  <td data-label="Slug" className="break-all px-5 py-4 text-sm">{item.slug}</td>
                  <td data-label="Products" className="px-5 py-4 text-sm">{item.productCount || 0}</td>
                  <td data-label="Status" className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td data-label="Actions" className="px-5 py-4">
                    <div className="responsive-table-actions">
                      <button onClick={() => navigate(`/admin-categories-edit/${item.id}`)} className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700">Edit</button>
                      <button onClick={() => remove(item)} className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">Delete</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td data-full="true" colSpan="6" className="p-10 text-center text-gray-500">{search ? 'No categories match your search.' : 'No categories found.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
