"use client";

import type { Product } from "@/types/product";
import ProductItem from "@/components/Common/ProductItem";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

const RecentlyViewdItems = ({ product }: { product: Product }) => {
  const { items } = useRecentlyViewed();
  const recentProducts = items
    .filter((entry) => entry.product.id !== product.id)
    .slice(0, 4)
    .map((entry) => entry.product);

  if (recentProducts.length === 0) return null;

  return (
    <section className="overflow-hidden pb-20 pt-15">
      <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
        <div className="mb-7">
          <span className="mb-1.5 block font-medium text-dark">
            Continue browsing
          </span>
          <h2 className="font-semibold text-xl text-dark xl:text-heading-5">
            Recently Viewed Products
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-x-7.5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {recentProducts.map((item) => (
            <ProductItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewdItems;
