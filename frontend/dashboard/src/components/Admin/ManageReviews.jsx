import React, { useEffect, useMemo, useState } from 'react';
import { api, getApiError, resolveImageUrl } from '../../lib/api';
import AdminPageShell from './AdminPageShell';

const getCategoryName = (review) =>
  review.product?.categoryEntity?.name || review.product?.category || 'Uncategorized';

const getRating = (review) =>
  Math.min(5, Math.max(1, Math.round(Number(review.rating) || 1)));

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [productId, setProductId] = useState('');
  const [rating, setRating] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/reviews/admin/list')
      .then((response) => setReviews(Array.isArray(response.data) ? response.data : []))
      .catch((requestError) => setError(getApiError(requestError)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const categories = useMemo(
    () => Array.from(new Set(reviews.map(getCategoryName))).sort((a, b) => a.localeCompare(b)),
    [reviews],
  );

  const products = useMemo(() => {
    const unique = new Map();
    reviews.forEach((review) => {
      if (review.product?.id) unique.set(review.product.id, review.product.name || `Product #${review.product.id}`);
    });
    return Array.from(unique, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [reviews]);

  const ratingCounts = useMemo(
    () => [1, 2, 3, 4, 5].map((stars) => ({
      stars,
      count: reviews.filter((review) => getRating(review) === stars).length,
    })),
    [reviews],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    reviews.forEach((review) => {
      const name = getCategoryName(review);
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [reviews]);

  const productCounts = useMemo(() => {
    const counts = new Map();
    reviews.forEach((review) => {
      const id = review.product?.id || 0;
      const name = review.product?.name || 'Deleted product';
      const current = counts.get(id) || { id, name, category: getCategoryName(review), count: 0 };
      current.count += 1;
      counts.set(id, current);
    });
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reviews.filter((review) => {
      const reviewCategory = getCategoryName(review);
      if (category && reviewCategory !== category) return false;
      if (productId && String(review.product?.id || '') !== productId) return false;
      if (rating && String(getRating(review)) !== rating) return false;
      if (!query) return true;
      return [
        review.product?.name,
        reviewCategory,
        review.user?.name,
        review.review,
        review.feedback,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [reviews, search, category, productId, rating]);

  const moderate = async (review) => {
    try {
      await api.patch(`/reviews/admin/${review.id}/visibility`, { isVisible: !review.isVisible });
      load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  const remove = async (review) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await api.delete(`/reviews/admin/${review.id}`);
      load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setProductId('');
    setRating('');
  };

  const visibleCount = reviews.filter((review) => review.isVisible).length;
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
    : 0;

  return (
    <AdminPageShell
      title="Review Moderation"
      subtitle="Analyze reviews by rating, product, and category, then control public visibility."
    >
      {error && <div className="mb-5 break-words rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="mb-5 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Reviews', reviews.length, 'bg-blue-50 text-blue-700'],
          ['Average Rating', averageRating.toFixed(1), 'bg-amber-50 text-amber-700'],
          ['Reviewed Products', productCounts.length, 'bg-purple-50 text-purple-700'],
          ['Visible Reviews', `${visibleCount}/${reviews.length}`, 'bg-green-50 text-green-700'],
        ].map(([label, value, className]) => (
          <article key={label} className={`min-w-0 rounded-2xl border border-gray-100 p-4 shadow-sm sm:p-5 ${className}`}>
            <p className="text-sm font-medium opacity-80">{label}</p>
            <p className="mt-2 break-words text-2xl font-bold">{value}</p>
          </article>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ratingCounts.map(({ stars, count }) => (
          <button
            key={stars}
            type="button"
            onClick={() => setRating(rating === String(stars) ? '' : String(stars))}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${rating === String(stars) ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200' : 'border-gray-100 bg-white hover:border-amber-300'}`}
          >
            <p className="text-sm font-semibold text-amber-500">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500">{stars} star review{count === 1 ? '' : 's'}</p>
          </button>
        ))}
      </div>

      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-5">
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-1">
            <label htmlFor="review-search" className="mb-2 block text-sm font-semibold text-gray-700">Search reviews</label>
            <input
              id="review-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Product, category, customer, or review text…"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label htmlFor="review-category" className="mb-2 block text-sm font-semibold text-gray-700">Category</label>
            <select id="review-category" value={category} onChange={(event) => { setCategory(event.target.value); setProductId(''); }} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <option value="">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="review-product" className="mb-2 block text-sm font-semibold text-gray-700">Product</label>
            <select id="review-product" value={productId} onChange={(event) => setProductId(event.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <option value="">All products</option>
              {products
                .filter((item) => !category || reviews.some((review) => review.product?.id === item.id && getCategoryName(review) === category))
                .map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="review-rating" className="mb-2 block text-sm font-semibold text-gray-700">Rating</label>
            <select id="review-rating" value={rating} onChange={(event) => setRating(event.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((stars) => <option key={stars} value={stars}>{stars} star{stars === 1 ? '' : 's'}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">Showing {filteredReviews.length} of {reviews.length} reviews.</p>
          <button type="button" onClick={resetFilters} className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:w-auto">Clear Filters</button>
        </div>
      </div>

      {!loading && reviews.length > 0 && (
        <div className="mb-5 grid min-w-0 gap-4 lg:grid-cols-2">
          <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-5">
            <h2 className="text-lg font-semibold">Reviews by Category</h2>
            <div className="mt-4 space-y-3">
              {categoryCounts.map((item) => (
                <button key={item.name} type="button" onClick={() => setCategory(item.name)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 text-left hover:bg-blue-50">
                  <span className="min-w-0 break-words font-medium">{item.name}</span>
                  <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{item.count}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-5">
            <h2 className="text-lg font-semibold">Reviews by Product</h2>
            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {productCounts.map((item) => (
                <button key={item.id} type="button" onClick={() => setProductId(String(item.id))} className="flex w-full items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 text-left hover:bg-blue-50">
                  <span className="min-w-0"><span className="block break-words font-medium">{item.name}</span><span className="block text-xs text-gray-500">{item.category}</span></span>
                  <span className="shrink-0 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">{item.count}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-lg sm:p-10">Loading reviews…</div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-2xl bg-white px-4 py-10 text-center text-gray-500 shadow-lg sm:p-12">
          {reviews.length === 0 ? 'No reviews submitted yet.' : 'No reviews match the selected filters.'}
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-5">
          {filteredReviews.map((review) => (
            <article key={review.id} className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-5">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                {review.image && (
                  <img src={resolveImageUrl(review.image)} alt="Review" className="h-40 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-20" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-col items-start gap-2 min-[420px]:flex-row min-[420px]:justify-between">
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold">{review.product?.name || 'Product'}</h2>
                      <p className="break-words text-sm text-gray-500">{getCategoryName(review)} · {review.user?.name || 'Customer'} · Order item #{review.orderItem?.id || '—'}</p>
                    </div>
                    <span className="shrink-0 break-words text-amber-500">{'★'.repeat(getRating(review))}{'☆'.repeat(5 - getRating(review))}</span>
                  </div>

                  <p className="mt-4 break-words text-gray-800">{review.review}</p>
                  {review.feedback && <p className="mt-2 break-words text-sm text-gray-500">Feedback: {review.feedback}</p>}

                  <div className="mt-5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
                    <button onClick={() => moderate(review)} className={`w-full rounded-lg px-4 py-2 text-sm font-medium min-[420px]:w-auto ${review.isVisible ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {review.isVisible ? 'Hide Review' : 'Show Review'}
                    </button>
                    <button onClick={() => remove(review)} className="w-full rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 min-[420px]:w-auto">Delete</button>
                    <span className={`inline-flex w-max rounded-full px-3 py-1 text-xs sm:ml-auto ${review.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {review.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
