import React, { useCallback, useEffect, useState } from "react";
import { api, getApiError, resolveImageUrl } from "../../lib/api";
import { useNavigate } from "react-router-dom";
import { formatPKR } from '../../lib/currency';
import AdminPageShell from './AdminPageShell';

const getDiscountedPrice = (product) => {
  const price = Number(product.price);
  const percentage = Number(product.discountPercentage);
  if (!product.discountEnabled || !Number.isFinite(percentage) || percentage <= 0) {
    return price;
  }
  return Math.round((price * (1 - percentage / 100) + Number.EPSILON) * 100) / 100;
};

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/products", {
        params: {
          search: debouncedSearch || undefined,
          category: category || undefined,
        },
      });
      setProducts(res.data.products);
      setCategories(res.data.categories);
    } catch (error) {
      alert(getApiError(error, "Failed to fetch products"));
    } finally {
      setIsLoading(false);
    }
  }, [category, debouncedSearch]);

  const handleDelete = async (id, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) return;

    try {
      await api.delete(`/products/${id}`);
      alert("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      alert(getApiError(error, "Failed to delete product"));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= 5) return { text: 'Low Stock', color: 'bg-orange-100 text-orange-800' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <AdminPageShell
      title="Manage Products"
      subtitle={`${products.length} ${products.length === 1 ? 'product' : 'products'} found`}
      actions={(
        <button
          onClick={() => navigate("/admin-products-add")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl sm:w-auto"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Product</span>
        </button>
      )}
    >
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:mb-8 sm:p-6">
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-gray-700">Search Products</label>
            <div className="relative min-w-0">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full min-w-0 rounded-xl border border-gray-300 py-3 pl-10 pr-4 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-gray-700">Filter by Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
        {isLoading ? (
          <div className="p-4 sm:p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-200 sm:h-16 sm:w-16" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="responsive-table-scroll">
            <table className="responsive-table w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <tr key={product.id} className="transition-colors duration-150 hover:bg-gray-50">
                      <td data-label="Product" className="px-6 py-4 md:whitespace-nowrap">
                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                          <img
                            src={resolveImageUrl(product.image)}
                            alt={product.name}
                            className="h-14 w-14 shrink-0 rounded-lg bg-gray-100 object-cover sm:h-16 sm:w-16"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="break-words text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">ID: #{product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Price" className="px-6 py-4 md:whitespace-nowrap">
                        {product.discountEnabled && Number(product.discountPercentage) > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-gray-500 line-through">{formatPKR(product.price)}</span>
                            <span className="text-base font-semibold text-green-700 sm:text-lg">{formatPKR(getDiscountedPrice(product))}</span>
                            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">{Number(product.discountPercentage)}% OFF</span>
                          </div>
                        ) : (
                          <div className="text-base font-semibold text-blue-600 sm:text-lg">{formatPKR(product.price)}</div>
                        )}
                      </td>
                      <td data-label="Stock" className="px-6 py-4 md:whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${stockStatus.color}`}>{stockStatus.text}</span>
                          <span className="text-sm text-gray-600">({product.stock})</span>
                        </div>
                      </td>
                      <td data-label="Category" className="px-6 py-4 md:whitespace-nowrap">
                        <span className="inline-flex max-w-full break-words rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">{product.category}</span>
                      </td>
                      <td data-label="Actions" className="px-6 py-4 md:whitespace-nowrap">
                        <div className="responsive-table-actions">
                          <button
                            onClick={() => navigate(`/admin-product-view/${product.id}`)}
                            className="flex items-center gap-1 rounded-lg bg-blue-100 px-4 py-2 font-medium text-blue-700 transition-colors duration-200 hover:bg-blue-200"
                          >
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => navigate(`/admin-products-edit/${product.id}`)}
                            className="flex items-center gap-1 rounded-lg bg-green-100 px-4 py-2 font-medium text-green-700 transition-colors duration-200 hover:bg-green-200"
                          >
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="flex items-center gap-1 rounded-lg bg-red-100 px-4 py-2 font-medium text-red-700 transition-colors duration-200 hover:bg-red-200"
                          >
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-12 text-center sm:py-16">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 sm:mb-6 sm:h-24 sm:w-24">
              <svg className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">No products found</h3>
            <p className="mx-auto mb-6 max-w-md break-words text-sm text-gray-600 sm:text-base">
              {debouncedSearch || category
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first product"}
            </p>
            {!debouncedSearch && !category && (
              <button
                onClick={() => navigate("/admin-products-add")}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 sm:w-auto"
              >
                Add Your First Product
              </button>
            )}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
};

export default ManageProducts;
