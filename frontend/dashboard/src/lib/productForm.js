export const PRODUCT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MAX_COUNT = 5;

export const validateProductImage = (file, { required = false } = {}) => {
  if (!file) return required ? 'Select at least one product image.' : '';
  if (!PRODUCT_IMAGE_ACCEPT.split(',').includes(file.type)) {
    return 'Product images must be JPEG, PNG, or WebP.';
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return 'Each product image must be 5 MB or smaller.';
  }
  return '';
};

export const validateProductImages = (
  files,
  { required = false, existingCount = 0 } = {},
) => {
  const selected = Array.from(files || []);
  if (required && selected.length + existingCount === 0) {
    return 'Select at least one product image.';
  }
  if (selected.length + existingCount > PRODUCT_IMAGE_MAX_COUNT) {
    return `A product can have a maximum of ${PRODUCT_IMAGE_MAX_COUNT} images.`;
  }
  for (const file of selected) {
    const error = validateProductImage(file);
    if (error) return error;
  }
  return '';
};
