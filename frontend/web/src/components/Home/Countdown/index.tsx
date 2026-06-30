import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { formatPKR } from "@/lib/currency";

const CounDown = ({ product }: { product?: Product }) => {
  if (!product) return null;

  return (
    <section className="overflow-hidden py-20">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="relative z-1 flex min-h-0 flex-col items-stretch overflow-hidden rounded-lg bg-[#D0E9F3] p-4 sm:p-7.5 lg:min-h-[420px] lg:flex-row lg:items-center lg:p-10 xl:p-15">
          <div className="w-full relative z-10 lg:max-w-[480px]">
            <span className="block font-medium text-custom-1 text-blue mb-2.5">Featured Product</span>
            <h2 className="font-bold text-dark text-xl lg:text-heading-4 xl:text-heading-3 mb-3">{product.title}</h2>
            <p className="line-clamp-3">{product.description}</p>
            <div className="flex flex-wrap gap-3 sm:gap-6 mt-6">
              <div className="w-full rounded-lg bg-white px-5 py-3 shadow-2 sm:w-auto">
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
              <div className="w-full rounded-lg bg-white shadow-2 px-5 py-3 sm:w-auto"><span className="block text-custom-sm">Availability</span><strong className="text-xl text-dark">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</strong></div>
            </div>
            <Link href={`/shop-details?id=${product.id}`} className="inline-flex font-medium text-custom-sm text-white bg-blue py-3 px-9.5 rounded-md hover:bg-blue-dark mt-7.5">Check it Out!</Link>
          </div>
          <Image src="/images/countdown/countdown-bg.png" alt="" className="hidden lg:block absolute right-0 bottom-0 -z-1" width={737} height={482} />
          <Image src={product.image} alt={product.title} className="relative z-0 mx-auto mt-8 block max-h-[260px] max-w-full w-auto object-contain lg:absolute lg:right-4 lg:bottom-8 lg:-z-1 lg:mx-0 lg:mt-0 lg:max-h-[340px] lg:max-w-[420px] xl:right-24" style={{ width: "auto", height: "auto" }} width={411} height={376} />
        </div>
      </div>
    </section>
  );
};

export default CounDown;
