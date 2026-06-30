import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { formatPKR } from "@/lib/currency";

const PromoBanner = ({ products }: { products: Product[] }) => {
  if (products.length === 0) return null;
  const [featured, secondary = featured, tertiary = secondary] = products;

  return (
    <section className="overflow-hidden py-20">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="relative z-1 overflow-hidden rounded-lg bg-[#F5F5F7] py-12.5 lg:py-17.5 xl:py-22.5 px-4 sm:px-7.5 lg:px-14 xl:px-19 mb-7.5">
          <div className="max-w-[550px] w-full relative z-10">
            <span className="block font-medium text-xl text-dark mb-3">{featured.category}</span>
            <h2 className="font-bold text-xl lg:text-heading-4 xl:text-heading-3 text-dark mb-5">{featured.title}</h2>
            <p className="line-clamp-3">{featured.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <p className="font-semibold text-heading-5 text-blue">{formatPKR(featured.discountedPrice)}</p>
              {featured.discountedPrice < featured.price && (
                <>
                  <span className="text-dark-4 line-through">{formatPKR(featured.price)}</span>
                  <span className="rounded-full bg-red/10 px-2.5 py-1 text-xs font-semibold text-red">{featured.discountPercentage}% OFF</span>
                </>
              )}
            </div>
            <Link href={`/shop-details?id=${featured.id}`} className="inline-flex font-medium text-custom-sm text-white bg-blue py-[11px] px-9.5 rounded-md hover:bg-blue-dark mt-7.5">View Product</Link>
          </div>
          <Image src={featured.image} alt={featured.title} className="absolute bottom-5 right-4 lg:right-20 -z-1 max-h-[330px] w-auto object-contain" style={{ width: "auto", height: "auto" }} width={320} height={350} />
        </div>

        <div className="grid gap-7.5 grid-cols-1 lg:grid-cols-2">
          {[secondary, tertiary].map((product, index) => (
            <div key={`${product.id}-${index}`} className={`relative z-1 overflow-hidden rounded-lg ${index === 0 ? "bg-[#DBF4F3]" : "bg-[#FFECE1]"} py-10 xl:py-16 px-4 sm:px-7.5 xl:px-10 min-h-[300px]`}>
              <Image src={product.image} alt={product.title} className={`absolute top-1/2 -translate-y-1/2 ${index === 0 ? "left-3 sm:left-8" : "right-3 sm:right-8"} -z-1 max-h-[220px] max-w-[220px] w-auto object-contain`} style={{ width: "auto", height: "auto" }} width={220} height={220} />
              <div className={index === 0 ? "text-right ml-auto max-w-[280px]" : "max-w-[285px]"}>
                <span className="block text-lg text-dark mb-1.5">{product.category}</span>
                <h2 className="font-bold text-xl lg:text-heading-4 text-dark mb-2.5 line-clamp-2">{product.title}</h2>
                <div className={`flex flex-wrap items-center gap-2 ${index === 0 ? "justify-end" : ""}`}>
                  <p className="font-semibold text-custom-1 text-blue">{formatPKR(product.discountedPrice)}</p>
                  {product.discountedPrice < product.price && (
                    <>
                      <span className="text-custom-sm text-dark-4 line-through">{formatPKR(product.price)}</span>
                      <span className="rounded-full bg-red/10 px-2 py-1 text-[11px] font-semibold text-red">{product.discountPercentage}% OFF</span>
                    </>
                  )}
                </div>
                <Link href={`/shop-details?id=${product.id}`} className="inline-flex font-medium text-custom-sm text-white bg-dark py-2.5 px-8.5 rounded-md hover:bg-blue mt-9">View Product</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
