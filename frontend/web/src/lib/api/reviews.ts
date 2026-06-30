import type { Testimonial } from "@/types/testimonial";
import { API_BASE_URL, getUploadedImageUrl } from "./products";

type ApiTestimonial = {
  id: number;
  review: string;
  rating: number | string;
  reviewed_at: string;
  user?: {
    name?: string;
    profileImage?: string | null;
  };
  product?: {
    id?: number;
    name?: string;
  };
};

export const getTestimonials = async (
  limit = 12,
  signal?: AbortSignal,
): Promise<Testimonial[]> => {
  const response = await fetch(
    `${API_BASE_URL}/reviews/testimonials?limit=${Math.min(Math.max(limit, 1), 30)}`,
    {
      signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to load testimonials (${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];

  return data.map((item: ApiTestimonial) => ({
    id: item.id,
    review: item.review,
    rating: Number(item.rating) || 0,
    authorName: item.user?.name?.trim() || "Verified customer",
    authorImg: getUploadedImageUrl(
      item.user?.profileImage,
      "/images/users/user-01.jpg",
    ),
    productId: Number(item.product?.id) || 0,
    productName: item.product?.name?.trim() || "AliBazaar product",
    reviewedAt: item.reviewed_at,
  }));
};
