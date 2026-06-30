import type { Product, ProductReview } from "@/types/product";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
);

export const IMAGE_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || `${API_BASE_URL}/uploads`
);

type ApiProductImage = {
  id: number;
  image: string;
  sortOrder: number;
};

export type ApiCategoryItem = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive?: boolean;
  productCount?: number;
};

type ApiProduct = {
  id: number;
  name: string;
  description: string;
  price: number | string;
  discountEnabled?: boolean;
  discountPercentage?: number | string;
  stock: number | string;
  image: string;
  category: string;
  images?: ApiProductImage[];
  averageRating?: number | string;
  reviewCount?: number | string;
};

type ApiReview = {
  id: number;
  review: string;
  feedback?: string | null;
  rating: number | string;
  image?: string | null;
  reviewed_at: string;
  user?: {
    name?: string;
  };
};

type ProductsApiResponse = {
  products: ApiProduct[];
  categories: string[];
  categoryItems?: ApiCategoryItem[];
};

type ProductDetailsApiResponse = {
  product: ApiProduct;
  reviews: ApiReview[];
};

export type ProductFilters = {
  search?: string;
  category?: string;
};

export type ProductCatalogResponse = {
  products: Product[];
  categories: string[];
  categoryItems: ApiCategoryItem[];
};

export type ProductDetailsResponse = {
  product: Product;
  reviews: ProductReview[];
};

const toNumber = (value: number | string | undefined | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getUploadedImageUrl = (image?: string | null, fallback = '/images/placeholder-product.svg') => {
  const normalizedImage = image?.trim().replace(/\\/g, "/");
  if (!normalizedImage) return fallback;
  if (/^https?:\/\//i.test(normalizedImage)) return normalizedImage;

  if (normalizedImage.startsWith("/") && !normalizedImage.startsWith("/uploads/")) {
    return normalizedImage;
  }

  const imagePath = normalizedImage.replace(/^\/?uploads\//i, "");
  const encodedPath = imagePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return encodedPath
    ? `${IMAGE_BASE_URL}/${encodedPath}`
    : fallback;
};

export const getProductImageUrl = (image?: string | null) =>
  getUploadedImageUrl(image, '/images/placeholder-product.svg');

const mapReview = (review: ApiReview): ProductReview => ({
  id: review.id,
  review: review.review,
  feedback: review.feedback?.trim() || undefined,
  rating: toNumber(review.rating),
  image: review.image ? getProductImageUrl(review.image) : undefined,
  reviewedAt: review.reviewed_at,
  userName: review.user?.name?.trim() || "Verified customer",
});

const mapProduct = (
  product: ApiProduct,
  reviews: ProductReview[] = []
): Product => {
  const price = toNumber(product.price);
  const rawDiscountPercentage = toNumber(product.discountPercentage);
  const discountPercentage = product.discountEnabled
    ? Math.min(100, Math.max(0, rawDiscountPercentage))
    : 0;
  const discountEnabled = price > 0 && discountPercentage > 0;
  const discountedPrice = discountEnabled
    ? Math.round((price * (1 - discountPercentage / 100) + Number.EPSILON) * 100) / 100
    : price;
  const gallery = Array.from(
    new Set(
      [
        ...(Array.isArray(product.images)
          ? [...product.images]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => item.image)
          : []),
        product.image,
      ]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => getProductImageUrl(value)),
    ),
  );
  const image = gallery[0] || getProductImageUrl(product.image);
  const reviewCount = reviews.length || toNumber(product.reviewCount);
  const rating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : toNumber(product.averageRating);

  return {
    id: product.id,
    title: product.name,
    description: product.description,
    category: product.category,
    stock: toNumber(product.stock),
    reviews: reviewCount,
    rating,
    price,
    discountedPrice,
    discountEnabled,
    discountPercentage,
    image,
    imgs: {
      thumbnails: gallery.length ? gallery : [image],
      previews: gallery.length ? gallery : [image],
    },
    reviewItems: reviews,
  };
};

const fetchJson = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Cannot connect to the AliBazaar API. Start the NestJS backend on port 5000 and try again.",
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.message === "string") message = body.message;
      if (Array.isArray(body?.message)) message = body.message.join(" ");
    } catch {
      // Keep the status-based error when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export const getProducts = async (
  filters: ProductFilters = {},
  signal?: AbortSignal
): Promise<ProductCatalogResponse> => {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.category?.trim()) params.set("category", filters.category.trim());

  const query = params.toString();
  const data = await fetchJson<ProductsApiResponse>(
    `/products${query ? `?${query}` : ""}`,
    { signal }
  );

  return {
    products: Array.isArray(data.products) ? data.products.map((item) => mapProduct(item)) : [],
    categories: Array.isArray(data.categories)
      ? Array.from(
          new Set(
            data.categories
              .map((category) => category?.trim())
              .filter((category): category is string => Boolean(category))
          )
        )
      : [],
    categoryItems: Array.isArray(data.categoryItems) ? data.categoryItems : [],
  };
};

export const getProductDetails = async (
  productId: number,
  signal?: AbortSignal
): Promise<ProductDetailsResponse> => {
  const data = await fetchJson<ProductDetailsApiResponse>(
    `/products/details/${productId}`,
    { signal }
  );
  const reviews = Array.isArray(data.reviews) ? data.reviews.map(mapReview) : [];

  return {
    product: mapProduct(data.product, reviews),
    reviews,
  };
};

export const getRelatedProducts = async (
  product: Product,
  limit = 4,
  signal?: AbortSignal
): Promise<Product[]> => {
  const result = await getProducts({ category: product.category }, signal);
  return result.products.filter((item) => item.id !== product.id).slice(0, limit);
};
