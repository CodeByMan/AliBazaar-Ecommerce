"use client";

import Image from "next/image";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import ProductPrice from "@/components/Common/ProductPrice";

const LatestProducts = () => {
  const { products, loading, error } = useProducts();
  const latestProducts = [...products].sort((a, b) => b.id - a.id).slice(0, 3);

  if (!loading && (error || latestProducts.length === 0)) return null;

  return (
    <div className="shadow-1 bg-white rounded-xl mt-7.5">
      <div className="px-4 sm:px-6 py-4.5 border-b border-gray-3">
        <h2 className="font-medium text-lg text-dark">Latest Products</h2>
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-22.5 rounded bg-gray-2 animate-pulse" />)
          ) : (
            latestProducts.map((product) => (
              <div className="flex items-center gap-6" key={product.id}>
                <div className="flex items-center justify-center rounded-[10px] bg-gray-3 max-w-[90px] w-full h-22.5 p-2">
                  <Image src={product.image} alt={product.title} width={74} height={74} className="max-h-[74px] w-auto object-contain" style={{ width: "auto", height: "auto" }} />
                </div>
                <div>
                  <h3 className="font-medium text-dark mb-1 ease-out duration-200 hover:text-blue">
                    <Link href={`/shop-details?id=${product.id}`}>{product.title}</Link>
                  </h3>
                  <ProductPrice price={product.price} discountedPrice={product.discountedPrice} discountPercentage={product.discountPercentage} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LatestProducts;
