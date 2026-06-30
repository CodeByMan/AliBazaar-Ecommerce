import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import HeroCarousel from "./HeroCarousel";
import HeroFeature from "./HeroFeature";
import { formatPKR } from "@/lib/currency";

const Hero = ({ products, loading }: { products: Product[]; loading: boolean }) => {
  const sideProducts = products.slice(3, 5);

  return (
    <section className="overflow-hidden pb-10 pt-8 sm:pt-10 lg:pb-12.5 lg:pt-12 xl:pb-15 xl:pt-15 bg-[#E5EAF4]">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="flex flex-wrap items-stretch gap-5">
          <div className="flex w-full xl:max-w-[757px]">
            <div className="relative z-1 h-full w-full overflow-hidden rounded-[10px] bg-white">
              <Image src="/images/hero/hero-bg.png" alt="" className="absolute right-0 bottom-0 -z-1" width={534} height={520} />
              <HeroCarousel products={products.slice(0, 3)} loading={loading} />
            </div>
          </div>

          <div className="flex w-full xl:max-w-[393px]">
            <div className="flex h-full w-full flex-col gap-5 sm:flex-row xl:flex-col">
              {loading && sideProducts.length === 0
                ? Array.from({ length: 2 }).map((_, index) => <div key={index} className="min-h-[230px] w-full rounded-[10px] bg-white p-7.5 animate-pulse xl:min-h-0 xl:flex-1"><div className="h-6 w-1/2 bg-gray-2 rounded mb-20" /><div className="h-8 w-24 bg-gray-2 rounded" /></div>)
                : sideProducts.map((product) => (
                    <div key={product.id} className="relative w-full overflow-hidden rounded-[10px] bg-white p-4 sm:p-7.5 xl:flex-1">
                      <div className="flex items-center justify-between gap-5">
                        <div className="relative z-10">
                          <h2 className="max-w-[180px] font-semibold text-dark text-xl mb-12 line-clamp-2"><Link href={`/shop-details?id=${product.id}`}>{product.title}</Link></h2>
                          <p className="font-medium text-dark-4 text-custom-sm mb-1.5">{product.category}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-heading-5 text-red">{formatPKR(product.discountedPrice)}</span>
                            {product.discountedPrice < product.price && (
                              <>
                                <span className="text-custom-sm text-dark-4 line-through">{formatPKR(product.price)}</span>
                                <span className="rounded-full bg-red/10 px-2 py-1 text-[11px] font-semibold text-red">{product.discountPercentage}% OFF</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Image src={product.image} alt={product.title} width={135} height={170} className="max-h-[170px] max-w-[135px] w-auto object-contain" style={{ width: "auto", height: "auto" }} />
                      </div>
                    </div>
                  ))}
              {!loading && sideProducts.length === 0 && (
                <div className="w-full rounded-[10px] bg-white p-7.5 xl:flex-1"><h2 className="font-semibold text-dark text-xl mb-4">Explore our catalog</h2><Link href="/shop-with-sidebar" className="text-blue font-medium">Browse products</Link></div>
              )}
            </div>
          </div>
        </div>
      </div>
      <HeroFeature />
    </section>
  );
};

export default Hero;
