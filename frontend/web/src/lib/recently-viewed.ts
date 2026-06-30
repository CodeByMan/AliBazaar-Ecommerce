import type { Product } from "@/types/product";

const STORAGE_KEY = "alibazaar-recently-viewed-v1";
const EVENT_NAME = "alibazaar:recently-viewed-updated";
const MAX_ITEMS = 12;

export type RecentlyViewedEntry = {
  product: Product;
  viewedAt: number;
};

export const readRecentlyViewed = (): RecentlyViewedEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is RecentlyViewedEntry =>
          Boolean(
            entry &&
              typeof entry === "object" &&
              "product" in entry &&
              "viewedAt" in entry,
          ),
      )
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, MAX_ITEMS);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

export const addRecentlyViewed = (product: Product) => {
  if (typeof window === "undefined") return;
  const next = [
    { product, viewedAt: Date.now() },
    ...readRecentlyViewed().filter((entry) => entry.product.id !== product.id),
  ].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const clearRecentlyViewed = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const RECENTLY_VIEWED_EVENT = EVENT_NAME;
