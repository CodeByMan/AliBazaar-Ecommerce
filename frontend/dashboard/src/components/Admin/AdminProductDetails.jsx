import React, { useEffect, useMemo, useState } from "react";
import { api, getApiError, resolveImageUrl } from "../../lib/api";
import { useParams, useNavigate } from "react-router-dom";
import { formatPKR } from '../../lib/currency';
import AdminPageShell, { secondaryButton } from './AdminPageShell';

const getDiscountedPrice = (product) => {
  const price = Number(product.price);
  const percentage = Number(product.discountPercentage);
  if (!product.discountEnabled || !Number.isFinite(percentage) || percentage <= 0) {
    return price;
  }
  return Math.round((price * (1 - percentage / 100) + Number.EPSILON) * 100) / 100;
};

const getImageValue = (image) => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.image || image.url || image.path || image.filename || image.file || '';
};

const AdminProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ product: {}, reviews: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const [detailsResponse, productResponse] = await Promise.all([
          api.get(`/products/details/${id}`),
          api.get(`/products/${id}`).catch(() => null),
        ]);

        const detailsData = detailsResponse.data || {};
        const productData = productResponse?.data || {};
        const detailsProduct = detailsData.product || {};

        setData({
          ...detailsData,
          product: {
            ...productData,
            ...detailsProduct,
            images: Array.isArray(detailsProduct.images)
              ? detailsProduct.images
              : Array.isArray(productData.images)
                ? productData.images
                : [],
            image: detailsProduct.image || productData.image || '',
          },
          reviews: Array.isArray(detailsData.reviews) ? detailsData.reviews : [],
        });
      } catch (err) {
        alert(getApiError(err, "Error fetching product details"));
        navigate("/admin-products");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const { product, reviews } = data;

  const productImages = useMemo(() => {
    const relationImages = Array.isArray(product.images) ? product.images : [];
    const values = [
      ...relationImages.map(getImageValue),
      getImageValue(product.image),
    ].filter(Boolean);

    return [...new Set(values)].map((image) => ({
      original: image,
      url: resolveImageUrl(image),
    }));
  }, [product.image, product.images]);

  useEffect(() => {
    if (!productImages.length) {
      setSelectedImage('');
      return;
    }

    setSelectedImage((current) => (
      productImages.some((image) => image.url === current)
        ? current
        : productImages[0].url
    ));
  }, [productImages]);

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= 5) return { text: 'Low Stock', color: 'bg-orange-100 text-orange-800' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const renderStars = (rating) => (
    [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ))
  );

  const backAction = (
    <button
      type="button"
      onClick={() => navigate("/admin-products")}
      className={secondaryButton}
    >
      ← Back to Products
    </button>
  );

  if (isLoading) {
    return (
      <AdminPageShell title="Product Details" subtitle="View product information and customer reviews." actions={backAction}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-2">
            <div className="h-64 rounded-2xl bg-gray-200 sm:h-80 lg:h-96" />
            <div className="space-y-4 rounded-2xl bg-white p-4 shadow-lg sm:p-6">
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-20 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  const stockStatus = getStockStatus(product.stock);

  return (
    <AdminPageShell
      title="Product Details"
      subtitle={`Product #${product.id || id}`}
      actions={backAction}
    >
      <div className="mx-auto w-full max-w-6xl min-w-0">
        <div className="mb-8 grid min-w-0 grid-cols-1 gap-5 sm:mb-10 sm:gap-8 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-6">
            {selectedImage ? (
              <>
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-64 w-full rounded-xl bg-gray-100 object-contain sm:h-80 lg:h-96"
                />

                {productImages.length > 1 && (
                  <div className="mt-4 grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 sm:grid-cols-5">
                    {productImages.map((image, index) => (
                      <button
                        key={`${image.original}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(image.url)}
                        className={`overflow-hidden rounded-lg border-2 bg-gray-100 p-1 transition ${
                          selectedImage === image.url
                            ? 'border-blue-600 ring-2 ring-blue-100'
                            : 'border-transparent hover:border-blue-300'
                        }`}
                        aria-label={`Show product image ${index + 1}`}
                      >
                        <img
                          src={image.url}
                          alt={`${product.name} ${index + 1}`}
                          className="h-16 w-full rounded-md object-cover sm:h-20"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500 sm:h-80 lg:h-96">No product image</div>
            )}
          </div>

          <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-5 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
              <h1 className="min-w-0 break-words text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{product.name}</h1>
              <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-medium ${stockStatus.color}`}>{stockStatus.text}</span>
            </div>

            <div className="space-y-5">
              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 break-words leading-relaxed text-gray-700">{product.description}</p>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 min-[400px]:grid-cols-2">
                <div className="min-w-0 rounded-xl bg-blue-50/50 p-3">
                  <label className="text-sm font-medium text-gray-500">Price</label>
                  {product.discountEnabled && Number(product.discountPercentage) > 0 ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-500 line-through">{formatPKR(product.price)}</span>
                      <span className="break-words text-xl font-bold text-green-700 sm:text-2xl">{formatPKR(getDiscountedPrice(product))}</span>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">{Number(product.discountPercentage)}% OFF</span>
                    </div>
                  ) : (
                    <p className="mt-1 break-words text-xl font-bold text-blue-600 sm:text-2xl">{formatPKR(product.price)}</p>
                  )}
                </div>
                <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                  <label className="text-sm font-medium text-gray-500">Stock</label>
                  <p className="mt-1 break-words text-lg font-semibold text-gray-900">{product.stock} units</p>
                </div>
              </div>

              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="mt-1 break-words text-gray-700">{product.category}</p>
              </div>

              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-500">Images</label>
                <p className="mt-1 text-gray-700">{productImages.length}</p>
              </div>

              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-500">Product ID</label>
                <p className="mt-1 break-all text-gray-700">#{product.id}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-6">
          <div className="mb-6 flex min-w-0 flex-col items-start gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
            <h2 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">Customer Reviews</h2>
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="px-2 py-10 text-center sm:py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No reviews yet</h3>
              <p className="break-words text-gray-600">This product hasn&apos;t received any reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="min-w-0 border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                  <div className="mb-3 flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 font-semibold text-white">
                      {review.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="break-words font-semibold text-gray-900">{review.user?.name}</h4>
                      <div className="mt-1 flex flex-col items-start gap-1 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-2">
                        <div className="flex shrink-0">{renderStars(review.rating)}</div>
                        <span className="break-words text-sm text-gray-500">{new Date(review.reviewed_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mb-4 break-words leading-relaxed text-gray-700">{review.review}</p>

                  {review.image && (
                    <div className="mt-3">
                      <img
                        src={resolveImageUrl(review.image)}
                        alt="Review"
                        className="h-28 w-28 rounded-lg border border-gray-200 object-cover shadow-sm sm:h-32 sm:w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AdminProductDetails;
