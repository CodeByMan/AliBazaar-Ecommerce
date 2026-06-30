"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearRecentlyViewed,
  readRecentlyViewed,
  RECENTLY_VIEWED_EVENT,
  type RecentlyViewedEntry,
} from "@/lib/recently-viewed";

export const useRecentlyViewed = () => {
  const [items, setItems] = useState<RecentlyViewedEntry[]>([]);

  const refresh = useCallback(() => setItems(readRecentlyViewed()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(RECENTLY_VIEWED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(RECENTLY_VIEWED_EVENT, refresh);
    };
  }, [refresh]);

  const clear = useCallback(() => {
    clearRecentlyViewed();
    setItems([]);
  }, []);

  return { items, clear, refresh };
};
