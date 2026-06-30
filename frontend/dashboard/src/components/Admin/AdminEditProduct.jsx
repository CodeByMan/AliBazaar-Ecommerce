import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageShell, { secondaryButton } from "./AdminPageShell";
import { api, getApiError, resolveImageUrl } from "../../lib/api";
import { formatPKR } from "../../lib/currency";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_COUNT,
  validateProductImages,
} from "../../lib/productForm";

const AdminEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({ name: "", description: "", price: "", stock: "", category: "", categoryId: "", discountEnabled: false, discountPercentage: "" });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const newPreviews = useMemo(
    () => newImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [newImages],
  );
  useEffect(
    () => () => newPreviews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [newPreviews],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data }, { data: categoryData }] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/categories/admin"),
        ]);
        const relationImages = Array.isArray(data.images) ? data.images : [];
        setExistingImages(
          relationImages.length
            ? relationImages.map((image) => ({ id: image.id, image: image.image }))
            : data.image
              ? [{ id: null, image: data.image }]
              : [],
        );
        setProduct({
          name: data.name || "",
          description: data.description || "",
          price: String(data.price ?? ""),
          stock: String(data.stock ?? ""),
          category: data.category || "",
          categoryId: String(data.categoryEntity?.id || data.categoryId || ""),
          discountEnabled: data.discountEnabled === true || Number(data.discountEnabled) === 1,
          discountPercentage: data.discountEnabled ? String(data.discountPercentage ?? "") : "",
        });
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (error) {
        setCategoryError(getApiError(error, "Unable to load product details."));
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProduct((previous) => ({ ...previous, [name]: value }));
  };

  const handleDiscountToggle = (event) => {
    const enabled = event.target.value === "yes";
    setProduct((previous) => ({
      ...previous,
      discountEnabled: enabled,
      discountPercentage: enabled ? previous.discountPercentage : "",
    }));
  };

  const discountPercentage = Number(product.discountPercentage);
  const originalPrice = Number(product.price);
  const discountedPreview =
    product.discountEnabled &&
    Number.isFinite(originalPrice) &&
    originalPrice > 0 &&
    Number.isFinite(discountPercentage) &&
    discountPercentage > 0
      ? Math.round((originalPrice * (1 - discountPercentage / 100) + Number.EPSILON) * 100) / 100
      : originalPrice;

  const handleImagesChange = (event) => {
    const selected = Array.from(event.target.files || []);
    const validationError = validateProductImages(selected, {
      existingCount: existingImages.length + newImages.length,
    });
    event.target.value = "";
    if (validationError) return alert(validationError);
    setNewImages((previous) => [...previous, ...selected]);
  };

  const totalImages = existingImages.length + newImages.length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const imageError = validateProductImages(newImages, {
      required: true,
      existingCount: existingImages.length,
    });
    if (imageError) return alert(imageError);
    if (
      product.discountEnabled &&
      (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage > 100)
    ) {
      return alert("Discount percentage must be greater than 0 and at most 100.");
    }
    setIsLoading(true);

    try {
      const payload = new FormData();
      payload.append("name", product.name);
      payload.append("description", product.description);
      payload.append("price", product.price);
      payload.append("stock", product.stock);
      payload.append("discountEnabled", String(product.discountEnabled));
      payload.append("discountPercentage", product.discountEnabled ? product.discountPercentage : "0");
      payload.append("category", product.category);
      if (product.categoryId) payload.append("categoryId", product.categoryId);
      payload.append(
        "keepImageIds",
        JSON.stringify(existingImages.map((image) => image.id).filter(Boolean)),
      );
      newImages.forEach((image) => payload.append("images", image));

      await api.patch(`/products/${id}`, payload);
      alert("Product updated successfully!");
      navigate("/admin-products");
    } catch (error) {
      alert(getApiError(error, "Error updating product. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) return <AdminPageShell title="Edit Product" subtitle="Update product details and gallery"><div className="rounded-2xl bg-white p-10 text-center shadow-lg">Loading product…</div></AdminPageShell>;

  const allPreviews = [
    ...existingImages.map((item) => ({ key: `existing-${item.id || item.image}`, url: resolveImageUrl(item.image), existing: true, item })),
    ...newPreviews.map((item, index) => ({ key: `new-${item.file.name}-${index}`, url: item.url, existing: false, index })),
  ];

  return (
    <AdminPageShell
      title="Edit Product"
      subtitle="Update product details and gallery"
      actions={<button type="button" onClick={() => navigate("/admin-products")} className={secondaryButton}>← Back to Products</button>}
    >
      <div className="mx-auto w-full max-w-4xl min-w-0">
        {categoryError && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{categoryError}</div>}

        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-3 shadow-lg sm:p-8">
          <form onSubmit={handleSubmit} className="min-w-0 space-y-6 sm:space-y-8">
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-2">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700">Product Images *</label>
                  <span className="text-xs font-medium text-gray-500">{totalImages}/{PRODUCT_IMAGE_MAX_COUNT}</span>
                </div>
                <div className="min-w-0 rounded-2xl border-2 border-dashed border-gray-300 p-3 transition-colors duration-200 hover:border-blue-400 sm:p-6">
                  <div className="grid min-w-0 grid-cols-2 gap-2 min-[420px]:gap-3 sm:grid-cols-3">
                    {allPreviews.map((preview, index) => (
                      <div key={preview.key} className="relative overflow-hidden rounded-xl bg-gray-100">
                        <img src={preview.url} alt={`Product image ${index + 1}`} className="h-32 w-full object-cover" />
                        {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">Primary</span>}
                        <button
                          type="button"
                          onClick={() => preview.existing
                            ? setExistingImages((items) => items.filter((item) => item !== preview.item))
                            : setNewImages((items) => items.filter((_, itemIndex) => itemIndex !== preview.index))}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-600 shadow hover:bg-red-50"
                          aria-label={`Remove image ${index + 1}`}
                        >×</button>
                      </div>
                    ))}
                  </div>
                  {!allPreviews.length && <p className="py-8 text-center text-sm text-red-600">Keep or upload at least one image.</p>}
                </div>
                <div className="mt-4 text-center">
                  <label className={`inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl sm:w-auto sm:px-6 ${totalImages >= PRODUCT_IMAGE_MAX_COUNT ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                    Add More Images
                    <input type="file" multiple onChange={handleImagesChange} accept={PRODUCT_IMAGE_ACCEPT} disabled={totalImages >= PRODUCT_IMAGE_MAX_COUNT} className="hidden" />
                  </label>
                  <p className="mt-3 text-xs text-gray-500">The first remaining image becomes the primary image.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label><input type="text" name="name" value={product.name} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Price (PKR) *</label><input type="number" name="price" value={product.price} onChange={handleChange} min="0" step="0.01" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label><input type="number" name="stock" value={product.stock} onChange={handleChange} min="0" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apply Product Discount?</label>
                      <select value={product.discountEnabled ? "yes" : "no"} onChange={handleDiscountToggle} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {product.discountEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount Percentage *</label>
                        <div className="relative">
                          <input type="number" name="discountPercentage" value={product.discountPercentage} onChange={handleChange} min="0.01" max="100" step="0.01" required className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
                          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-medium text-gray-500">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {product.discountEnabled && originalPrice > 0 && discountPercentage > 0 && discountPercentage <= 100 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-gray-500 line-through">{formatPKR(originalPrice)}</span>
                      <span className="font-semibold text-green-700">{formatPKR(discountedPreview)}</span>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 font-semibold text-red-700">{discountPercentage}% OFF</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select value={product.categoryId} onChange={(event) => { const category = categories.find((item) => String(item.id) === event.target.value); setProduct((previous) => ({ ...previous, categoryId: event.target.value, category: category?.name || previous.category })); }} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="">Select a category</option>
                    {categories.map((category) => <option key={category.id} value={category.id} disabled={category.isActive === false && String(category.id) !== String(product.categoryId)}>{category.name}{category.isActive === false ? " (Inactive)" : ""}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Product ID</label><input value={`#${id}`} disabled className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500" /></div>
              </div>
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-2">Description *</label><textarea name="description" value={product.description} onChange={handleChange} rows="4" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" /></div>

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:gap-4">
              <button type="submit" disabled={isLoading || totalImages === 0} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? "Updating Product..." : "Update Product"}</button>
              <button type="button" onClick={() => navigate("/admin-products")} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl shadow-lg border border-gray-200">Cancel</button>
            </div>
          </form>
        </div>

        <div className="mt-6 min-w-0 rounded-2xl border border-green-200 bg-green-50 p-4 sm:mt-8 sm:p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Current Product Information</h3>
          <div className="grid min-w-0 grid-cols-1 gap-4 text-sm text-green-800 min-[420px]:grid-cols-2 lg:grid-cols-5"><div><span className="font-medium">ID:</span> #{id}</div><div><span className="font-medium">Name:</span> {product.name}</div><div><span className="font-medium">Price:</span> {formatPKR(product.price)}</div><div><span className="font-medium">Discount:</span> {product.discountEnabled ? `${product.discountPercentage}%` : "None"}</div><div><span className="font-medium">Images:</span> {totalImages}</div></div>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AdminEditProduct;
