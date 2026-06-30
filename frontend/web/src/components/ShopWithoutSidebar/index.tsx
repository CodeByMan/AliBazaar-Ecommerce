"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "../Common/Breadcrumb";
import { EmptyProducts, ProductGridSkeleton, ProductLoadError } from "../Common/ProductStates";
import SingleGridItem from "../Shop/SingleGridItem";
import SingleListItem from "../Shop/SingleListItem";
import CustomSelect from "../ShopWithSidebar/CustomSelect";
import { useProducts } from "@/hooks/useProducts";

const ShopWithoutSidebar = () => {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const [productStyle, setProductStyle] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("latest");
  const result = useProducts({ search, category });

  const products = useMemo(() => {
    const items = [...result.products];
    if (sort === "oldest") return items.sort((a, b) => a.id - b.id);
    if (sort === "price-low") return items.sort((a, b) => a.price - b.price);
    if (sort === "price-high") return items.sort((a, b) => b.price - a.price);
    return items.sort((a, b) => b.id - a.id);
  }, [result.products, sort]);

  const sortOptions = [
    { label: "Latest Products", value: "latest" },
    { label: "Oldest Products", value: "oldest" },
    { label: "Price: Low to High", value: "price-low" },
    { label: "Price: High to Low", value: "price-high" },
  ];

  return (
    <>
      <Breadcrumb title="Explore All Products" pages={["shop", "/", "shop without sidebar"]} />
      <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28 bg-[#f3f4f6]">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="rounded-lg bg-white shadow-1 pl-3 pr-2.5 py-2.5 mb-6 flex items-center justify-between">
            <p>{result.loading ? "Loading products..." : `Showing ${products.length} product${products.length === 1 ? "" : "s"}`}</p>
            <div className="flex items-center gap-2.5">
              <CustomSelect options={sortOptions} value={sort} onChange={setSort} />
              <button type="button" onClick={() => setProductStyle("grid")} aria-label="Grid view" className={`flex items-center justify-center w-10 h-10 rounded-[5px] ${productStyle === "grid" ? "bg-blue text-white" : "bg-gray-1 text-dark"}`}>▦</button>
              <button type="button" onClick={() => setProductStyle("list")} aria-label="List view" className={`flex items-center justify-center w-10 h-10 rounded-[5px] ${productStyle === "list" ? "bg-blue text-white" : "bg-gray-1 text-dark"}`}>☰</button>
            </div>
          </div>

          {result.loading ? (
            <ProductGridSkeleton count={8} />
          ) : result.error ? (
            <ProductLoadError message={result.error} onRetry={result.retry} />
          ) : products.length === 0 ? (
            <EmptyProducts message="Try another search term or category." />
          ) : (
            <div className={productStyle === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7.5 gap-y-9" : "flex flex-col gap-7.5"}>
              {products.map((item) => productStyle === "grid" ? <SingleGridItem item={item} key={item.id} /> : <SingleListItem item={item} key={item.id} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ShopWithoutSidebar;
