import Image from "next/image";
import Link from "next/link";
import { EmptyProducts, ProductGridSkeleton, ProductLoadError } from "@/components/Common/ProductStates";
import { Product } from "@/types/product";
import SingleItem from "./SingleItem";

const BestSeller = ({
  products,
  loading,
  error,
  retry,
}: {
  products: Product[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}) => {
  return (
    <section className="overflow-hidden">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="flex items-center gap-2.5 font-medium text-dark mb-1.5">
              <Image src="/images/icons/icon-07.svg" alt="" width={17} height={17} />
              Catalog Picks
            </span>
            <h2 className="font-semibold text-xl xl:text-heading-5 text-dark">Featured Products</h2>
          </div>
        </div>

        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : error ? (
          <ProductLoadError message={error} onRetry={retry} />
        ) : products.length === 0 ? (
          <EmptyProducts />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7.5">
            {products.map((item) => <SingleItem item={item} key={item.id} />)}
          </div>
        )}

        <div className="text-center mt-12.5">
          <Link href="/shop-without-sidebar" className="inline-flex font-medium text-custom-sm py-3 px-7 sm:px-12.5 rounded-md border-gray-3 border bg-gray-1 text-dark ease-out duration-200 hover:bg-dark hover:text-white hover:border-transparent">View All</Link>
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
