type DiscountableProduct = {
  price: number | string;
  discountEnabled?: boolean | null;
  discountPercentage?: number | string | null;
};

const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const getProductDiscountPercentage = (
  product: DiscountableProduct,
): number => {
  if (!product.discountEnabled) return 0;

  const percentage = Number(product.discountPercentage);
  if (!Number.isFinite(percentage) || percentage <= 0) return 0;

  return Math.min(100, percentage);
};

export const getProductSalePrice = (product: DiscountableProduct): number => {
  const price = Number(product.price);
  if (!Number.isFinite(price) || price <= 0) return 0;

  const percentage = getProductDiscountPercentage(product);
  if (percentage <= 0) return money(price);

  return money(price * (1 - percentage / 100));
};
