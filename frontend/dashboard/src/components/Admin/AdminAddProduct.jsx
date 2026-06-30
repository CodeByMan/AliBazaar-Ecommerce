import React, { useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../../lib/api";
import { useNavigate } from "react-router-dom";
import { formatPKR } from "../../lib/currency";
import AdminPageShell, { secondaryButton } from "./AdminPageShell";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_COUNT,
  validateProductImages,
} from "../../lib/productForm";

const AdminAddProduct = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    categoryId: "",
    discountEnabled: false,
    discountPercentage: "",
  });
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");
  const navigate = useNavigate();

  const previews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images],
  );

  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get("/categories/admin");
        setCategories(
          (Array.isArray(data) ? data : []).filter(
            (category) => category.isActive !== false,
          ),
        );
      } catch (error) {
        setCategoryError(getApiError(error, "Unable to load categories."));
      }
    };
    loadCategories();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleDiscountToggle = (event) => {
    const enabled = event.target.value === "yes";
    setFormData((previous) => ({
      ...previous,
      discountEnabled: enabled,
      discountPercentage: enabled ? previous.discountPercentage : "",
    }));
  };

  const discountPercentage = Number(formData.discountPercentage);
  const originalPrice = Number(formData.price);
  const discountedPreview =
    formData.discountEnabled &&
    Number.isFinite(originalPrice) &&
    originalPrice > 0 &&
    Number.isFinite(discountPercentage) &&
    discountPercentage > 0
      ? Math.round((originalPrice * (1 - discountPercentage / 100) + Number.EPSILON) * 100) / 100
      : originalPrice;

  const handleImagesChange = (event) => {
    const selected = Array.from(event.target.files || []);
    const validationError = validateProductImages(selected, {
      existingCount: images.length,
    });
    event.target.value = "";
    if (validationError) return alert(validationError);
    setImages((previous) => [...previous, ...selected]);
  };

  const removeImage = (index) => {
    setImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const imageError = validateProductImages(images, { required: true });
    if (imageError) return alert(imageError);
    if (
      formData.discountEnabled &&
      (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage > 100)
    ) {
      return alert("Discount percentage must be greater than 0 and at most 100.");
    }
    setIsLoading(true);

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description);
      payload.append("price", formData.price);
      payload.append("stock", formData.stock);
      payload.append("discountEnabled", String(formData.discountEnabled));
      payload.append("discountPercentage", formData.discountEnabled ? formData.discountPercentage : "0");
      payload.append("category", formData.category);
      if (formData.categoryId) payload.append("categoryId", formData.categoryId);
      images.forEach((image) => payload.append("images", image));

      await api.post("/products", payload);
      alert("Product added successfully!");
      navigate("/admin-products");
    } catch (error) {
      alert(getApiError(error, "Error adding product. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      categoryId: "",
      discountEnabled: false,
      discountPercentage: "",
    });
    setImages([]);
  };

  return (
    <AdminPageShell
      title="Add New Product"
      subtitle="Create a new product for your store"
      actions={<button type="button" onClick={() => navigate("/admin-products")} className={secondaryButton}>← Back to Products</button>}
    >
      <div className="mx-auto w-full max-w-4xl min-w-0">
        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-3 shadow-lg sm:p-8">
          <form onSubmit={handleSubmit} className="min-w-0 space-y-6 sm:space-y-8">
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-2">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Images *
                  </label>
                  <span className="text-xs font-medium text-gray-500">
                    {images.length}/{PRODUCT_IMAGE_MAX_COUNT}
                  </span>
                </div>

                <div className="min-w-0 rounded-2xl border-2 border-dashed border-gray-300 p-3 transition-colors duration-200 hover:border-blue-400 sm:p-6">
                  {previews.length ? (
                    <div className="grid min-w-0 grid-cols-2 gap-2 min-[420px]:gap-3 sm:grid-cols-3">
                      {previews.map((preview, index) => (
                        <div key={`${preview.file.name}-${index}`} className="relative overflow-hidden rounded-xl bg-gray-100">
                          <img
                            src={preview.url}
                            alt={`Product preview ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
                              Primary
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-600 shadow hover:bg-red-50"
                            aria-label={`Remove image ${index + 1}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-3xl text-gray-400">▧</div>
                      <p className="mt-4 text-sm text-gray-600">No images selected</p>
                      <p className="mt-1 text-xs text-gray-500">Upload 1 to 5 JPEG, PNG, or WebP images. Each image can be up to 5 MB.</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <label className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl sm:w-auto sm:px-6 ${images.length >= PRODUCT_IMAGE_MAX_COUNT ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                    <span>{images.length ? "Add More Images" : "Choose Images"}</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleImagesChange}
                      accept={PRODUCT_IMAGE_ACCEPT}
                      disabled={images.length >= PRODUCT_IMAGE_MAX_COUNT}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-3 text-xs text-gray-500">The first image is used as the primary product image.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter product name" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (PKR) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" min="0" step="0.01" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="0" min="0" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apply Product Discount?</label>
                      <select
                        value={formData.discountEnabled ? "yes" : "no"}
                        onChange={handleDiscountToggle}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {formData.discountEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount Percentage *</label>
                        <div className="relative">
                          <input
                            type="number"
                            name="discountPercentage"
                            value={formData.discountPercentage}
                            onChange={handleChange}
                            placeholder="10"
                            min="0.01"
                            max="100"
                            step="0.01"
                            required
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-medium text-gray-500">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {formData.discountEnabled && originalPrice > 0 && discountPercentage > 0 && discountPercentage <= 100 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-gray-500 line-through">{formatPKR(originalPrice)}</span>
                      <span className="font-semibold text-green-700">{formatPKR(discountedPreview)}</span>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 font-semibold text-red-700">{discountPercentage}% OFF</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(event) => {
                      const category = categories.find((item) => String(item.id) === event.target.value);
                      setFormData((previous) => ({ ...previous, categoryId: event.target.value, category: category?.name || "" }));
                    }}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  {categoryError && <p className="mt-2 text-sm text-red-600">{categoryError}</p>}
                  {!categoryError && categories.length === 0 && <p className="mt-2 text-sm text-amber-600">Create an active category before adding products.</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe the product features, specifications, and benefits..." required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none" />
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:gap-4">
              <button type="submit" disabled={isLoading || categories.length === 0} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? "Adding Product..." : "Add Product"}
              </button>
              <button type="button" onClick={clearForm} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200">Clear Form</button>
            </div>
          </form>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AdminAddProduct;
