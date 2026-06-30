"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getProductDetails, getProducts } from "@/lib/api/products";
import type {
  ProductCatalogResponse,
  ProductDetailsResponse,
  ProductFilters,
} from "@/lib/api/products";

const AUTO_RETRY_DELAY = 5000;

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const isConnectionError = (error: unknown) =>
  error instanceof Error &&
  error.message.includes("Cannot connect to the AliBazaar API");

export const useProducts = (filters: ProductFilters = {}) => {
  const [data, setData] = useState<ProductCatalogResponse>({
    products: [],
    categories: [],
    categoryItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualRetryKey, setManualRetryKey] = useState(0);

  const search = filters.search?.trim() || "";
  const category = filters.category?.trim() || "";
  const stableFilters = useMemo(() => ({ search, category }), [search, category]);

  useEffect(() => {
    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let requestInFlight = false;

    const clearRetryTimer = () => {
      if (!retryTimer) return;
      clearTimeout(retryTimer);
      retryTimer = undefined;
    };

    const scheduleSilentRetry = () => {
      clearRetryTimer();
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        void load(false);
      }, AUTO_RETRY_DELAY);
    };

    const load = async (showLoading: boolean) => {
      if (disposed || requestInFlight) return;
      requestInFlight = true;

      if (showLoading) setLoading(true);

      try {
        const response = await getProducts(stableFilters, controller.signal);
        if (disposed) return;

        clearRetryTimer();
        setData(response);
        setError(null);
      } catch (requestError: unknown) {
        if (disposed || isAbortError(requestError)) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load products.",
        );

        if (isConnectionError(requestError)) scheduleSilentRetry();
      } finally {
        requestInFlight = false;
        if (showLoading && !disposed) setLoading(false);
      }
    };

    void load(true);

    const retryWhenOnline = () => {
      clearRetryTimer();
      void load(false);
    };

    window.addEventListener("online", retryWhenOnline);

    return () => {
      disposed = true;
      controller.abort();
      clearRetryTimer();
      window.removeEventListener("online", retryWhenOnline);
    };
  }, [stableFilters, manualRetryKey]);

  const retry = useCallback(
    () => setManualRetryKey((value) => value + 1),
    [],
  );

  return { ...data, loading, error, retry };
};

export const useProductDetails = (productId?: number) => {
  const [data, setData] = useState<ProductDetailsResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState<string | null>(null);
  const [manualRetryKey, setManualRetryKey] = useState(0);

  useEffect(() => {
    if (!productId || !Number.isInteger(productId) || productId <= 0) {
      setData(null);
      setLoading(false);
      setError("A valid product ID is required.");
      return;
    }

    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let requestInFlight = false;

    const clearRetryTimer = () => {
      if (!retryTimer) return;
      clearTimeout(retryTimer);
      retryTimer = undefined;
    };

    const scheduleSilentRetry = () => {
      clearRetryTimer();
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        void load(false);
      }, AUTO_RETRY_DELAY);
    };

    const load = async (showLoading: boolean) => {
      if (disposed || requestInFlight) return;
      requestInFlight = true;

      if (showLoading) setLoading(true);

      try {
        const response = await getProductDetails(productId, controller.signal);
        if (disposed) return;

        clearRetryTimer();
        setData(response);
        setError(null);
      } catch (requestError: unknown) {
        if (disposed || isAbortError(requestError)) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load product details.",
        );

        if (isConnectionError(requestError)) scheduleSilentRetry();
      } finally {
        requestInFlight = false;
        if (showLoading && !disposed) setLoading(false);
      }
    };

    void load(true);

    const retryWhenOnline = () => {
      clearRetryTimer();
      void load(false);
    };

    window.addEventListener("online", retryWhenOnline);

    return () => {
      disposed = true;
      controller.abort();
      clearRetryTimer();
      window.removeEventListener("online", retryWhenOnline);
    };
  }, [productId, manualRetryKey]);

  const retry = useCallback(
    () => setManualRetryKey((value) => value + 1),
    [],
  );

  return { data, loading, error, retry };
};
