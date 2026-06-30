"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "../Common/Breadcrumb";
import {
  EmptyProducts,
  ProductGridSkeleton,
  ProductLoadError,
} from "../Common/ProductStates";
import SingleGridItem from "../Shop/SingleGridItem";
import SingleListItem from "../Shop/SingleListItem";
import CustomSelect from "./CustomSelect";
import { useProducts } from "@/hooks/useProducts";

const PRODUCTS_PER_PAGE = 9;

type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

const getPaginationItems = (
  currentPage: number,
  totalPages: number,
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ];
};

const ShopWithSidebar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const requestedPage = Number(searchParams.get("page") || "1");
  const [productStyle, setProductStyle] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("latest");
  const result = useProducts({ search, category });
  const catalog = useProducts();

  const categoryItems = useMemo(
    () =>
      catalog.categories.map((name) => ({
        name,
        products: catalog.products.filter((item) => item.category === name)
          .length,
      })),
    [catalog.categories, catalog.products],
  );

  const products = useMemo(() => {
    const items = [...result.products];
    if (sort === "oldest") return items.sort((a, b) => a.id - b.id);
    if (sort === "price-low") return items.sort((a, b) => a.price - b.price);
    if (sort === "price-high") return items.sort((a, b) => b.price - a.price);
    return items.sort((a, b) => b.id - a.id);
  }, [result.products, sort]);

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const currentPage = Number.isInteger(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const pageStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = products.slice(
    pageStart,
    pageStart + PRODUCTS_PER_PAGE,
  );
  const shownFrom = products.length === 0 ? 0 : pageStart + 1;
  const shownTo = Math.min(pageStart + PRODUCTS_PER_PAGE, products.length);

  const pushParams = (params: URLSearchParams) => {
    const query = params.toString();
    router.push(`/shop-with-sidebar${query ? `?${query}` : ""}`);
  };

  const updateCategory = (nextCategory: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategory) params.set("category", nextCategory);
    else params.delete("category");
    params.delete("page");
    pushParams(params);
  };

  const updatePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) params.delete("page");
    else params.set("page", String(nextPage));
    pushParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortOptions = [
    { label: "Latest Products", value: "latest" },
    { label: "Oldest Products", value: "oldest" },
    { label: "Price: Low to High", value: "price-low" },
    { label: "Price: High to Low", value: "price-high" },
  ];

  const categoryOptions = [
    {
      label: `All Categories (${catalog.products.length})`,
      value: "",
    },
    ...categoryItems.map((item) => ({
      label: `${item.name} (${item.products})`,
      value: item.name,
    })),
  ];

  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <>
      <Breadcrumb
        title="Explore All Products"
        pages={["shop", "/", "shop with sidebar"]}
      />
      <section className="relative overflow-hidden bg-[#f3f4f6] pb-20 pt-5 lg:pt-20 xl:pt-28">
        <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
          <div className="w-full">
            <div className="mb-6 flex flex-col gap-4 rounded-lg bg-white px-3 py-3 shadow-1 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-dark">
                  {result.loading
                    ? "Loading products..."
                    : `Showing ${shownFrom}-${shownTo} of ${products.length} product${
                        products.length === 1 ? "" : "s"
                      }${search ? ` for “${search}”` : ""}`}
                </p>
                {category && (
                  <p className="mt-1 text-custom-xs text-dark-4">
                    Category: {category}
                  </p>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center gap-2.5 lg:w-auto lg:justify-end">
                <div className="min-w-[190px] flex-1 sm:flex-none">
                  <CustomSelect
                    options={categoryOptions}
                    value={category}
                    onChange={updateCategory}
                  />
                </div>
                <div className="min-w-[180px] flex-1 sm:flex-none">
                  <CustomSelect
                    options={sortOptions}
                    value={sort}
                    onChange={(value) => {
                      setSort(value);
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("page");
                      pushParams(params);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setProductStyle("grid")}
                  aria-label="Grid view"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] ${
                    productStyle === "grid"
                      ? "bg-blue text-white"
                      : "bg-gray-1 text-dark"
                  }`}
                >
                  ▦
                </button>
                <button
                  type="button"
                  onClick={() => setProductStyle("list")}
                  aria-label="List view"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] ${
                    productStyle === "list"
                      ? "bg-blue text-white"
                      : "bg-gray-1 text-dark"
                  }`}
                >
                  ☰
                </button>
              </div>
            </div>

            {result.loading ? (
              <ProductGridSkeleton count={PRODUCTS_PER_PAGE} />
            ) : result.error ? (
              <ProductLoadError message={result.error} onRetry={result.retry} />
            ) : products.length === 0 ? (
              <EmptyProducts message="Try another search term or category." />
            ) : (
              <>
                <div
                  className={
                    productStyle === "grid"
                      ? "grid grid-cols-1 gap-x-7.5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3"
                      : "flex flex-col gap-7.5"
                  }
                >
                  {paginatedProducts.map((item) =>
                    productStyle === "grid" ? (
                      <SingleGridItem item={item} key={item.id} />
                    ) : (
                      <SingleListItem item={item} key={item.id} />
                    ),
                  )}
                </div>

                {totalPages > 1 && (
                  <nav
                    className="mt-10 flex flex-wrap items-center justify-center gap-2"
                    aria-label="Product pagination"
                  >
                    <button
                      type="button"
                      onClick={() => updatePage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex min-h-[42px] items-center justify-center rounded-md border border-gray-3 bg-white px-4 text-custom-sm text-dark hover:border-blue hover:text-blue disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Previous
                    </button>

                    {paginationItems.map((item) =>
                      typeof item === "number" ? (
                        <button
                          type="button"
                          key={item}
                          onClick={() => updatePage(item)}
                          aria-current={item === currentPage ? "page" : undefined}
                          className={`flex h-[42px] min-w-[42px] items-center justify-center rounded-md border px-3 text-custom-sm font-medium ${
                            item === currentPage
                              ? "border-blue bg-blue text-white"
                              : "border-gray-3 bg-white text-dark hover:border-blue hover:text-blue"
                          }`}
                        >
                          {item}
                        </button>
                      ) : (
                        <span
                          key={item}
                          className="flex h-[42px] min-w-[32px] items-center justify-center text-dark-4"
                          aria-hidden="true"
                        >
                          …
                        </span>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={() => updatePage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex min-h-[42px] items-center justify-center rounded-md border border-gray-3 bg-white px-4 text-custom-sm text-dark hover:border-blue hover:text-blue disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopWithSidebar;
