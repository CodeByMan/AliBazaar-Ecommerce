"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import ProductItem from "@/components/Common/ProductItem";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export default function RecentlyViewed() {
  const { items, clear } = useRecentlyViewed();

  return (
    <>
      <Breadcrumb title="Recently Viewed" pages={["Recently Viewed"]} />
      <section className="bg-gray-2 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-xl text-dark sm:text-2xl">
                Your Browsing History
              </h2>
              <p className="mt-1 text-dark-4">
                Products viewed on this browser are saved here automatically.
              </p>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="w-full rounded-md border border-gray-3 bg-white px-5 py-2.5 font-medium text-dark hover:border-blue hover:text-blue sm:w-auto"
              >
                Clear History
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-1">
              No products have been viewed yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-7.5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(({ product }) => (
                <ProductItem key={product.id} item={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
