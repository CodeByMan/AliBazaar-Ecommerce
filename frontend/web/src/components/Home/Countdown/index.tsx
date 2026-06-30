import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { formatPKR } from "@/lib/currency";

const CounDown = ({ product }: { product?: Product }) => {
  if (!product) return null;

  return (
    <section className="overflow-hidden py-20">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="relative overflow-hidden z-1 rounded-lg bg-[#D0E9F3] p-4 sm:p-7.5 lg:p-10 xl:p-15 min-h-[420px] flex items-center">
          <div className="max-w-[480px] w-full relative z-10">
            <span className="block font-medium text-custom-1 text-blue mb-2.5">Featured Product</span>
            <h2 className="font-bold text-dark text-xl lg:text-heading-4 xl:text-heading-3 mb-3">{product.title}</h2>
            <p className="line-clamp-3">{product.description}</p>
            <div className="flex flex-wrap gap-6 mt-6">
              <div className="rounded-lg bg-white px-5 py-3 shadow-2">
                <span className="block text-custom-sm">Price</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <strong className="text-xl text-dark">{formatPKR(product.discountedPrice)}</strong>
                  {product.discountedPrice < product.price && (
                    <>
                      <span className="text-custom-sm text-dark-4 line-through">{formatPKR(product.price)}</span>
                      <span className="rounded-full bg-red/10 px-2 py-1 text-[11px] font-semibold text-red">{product.discountPercentage}% OFF</span>
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-white shadow-2 px-5 py-3"><span className="block text-custom-sm">Availability</span><strong className="text-xl text-dark">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</strong></div>
            </div>
            <Link href={`/shop-details?id=${product.id}`} className="inline-flex font-medium text-custom-sm text-white bg-blue py-3 px-9.5 rounded-md hover:bg-blue-dark mt-7.5">Check it Out!</Link>
          </div>
          <Image src="/images/countdown/countdown-bg.png" alt="" className="hidden sm:block absolute right-0 bottom-0 -z-1" width={737} height={482} />
          <Image src={product.image} alt={product.title} className="hidden lg:block absolute right-4 xl:right-24 bottom-8 -z-1 max-h-[340px] max-w-[420px] w-auto object-contain" style={{ width: "auto", height: "auto" }} width={411} height={376} />
        </div>
      </div>
    </section>
  );
};

export default CounDown;
