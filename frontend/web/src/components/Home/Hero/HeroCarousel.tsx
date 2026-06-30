"use client";

import Image from "next/image";
import Link from "next/link";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Product } from "@/types/product";
import { formatPKR } from "@/lib/currency";

const HeroCarousel = ({ products, loading }: { products: Product[]; loading: boolean }) => {
  if (loading) {
    return <div className="min-h-[520px] animate-pulse flex items-center justify-between p-12"><div className="w-1/2 space-y-5"><div className="h-10 bg-gray-2 rounded" /><div className="h-24 bg-gray-2 rounded" /><div className="h-12 w-32 bg-gray-2 rounded" /></div><div className="w-72 h-72 rounded-full bg-gray-2" /></div>;
  }

  if (products.length === 0) {
    return <div className="min-h-[520px] flex items-center px-8 sm:px-12"><div><span className="block font-semibold text-heading-3 text-blue mb-5">Welcome</span><h1 className="font-semibold text-dark text-3xl mb-3">Your live product catalog is ready</h1><p>Products added from the admin dashboard will appear here automatically.</p><Link href="/shop-with-sidebar" className="inline-flex font-medium text-white text-custom-sm rounded-md bg-dark py-3 px-9 hover:bg-blue mt-10">Shop Now</Link></div></div>;
  }

  return (
    <Swiper spaceBetween={30} centeredSlides autoplay={{ delay: 3500, disableOnInteraction: false }} pagination={{ clickable: true }} modules={[Autoplay, Pagination]} className="hero-carousel">
      {products.map((product) => (
        <SwiperSlide key={product.id}>
          <div className="flex items-center pt-6 sm:pt-0 flex-col-reverse sm:flex-row min-h-[520px]">
            <div className="max-w-[394px] py-10 sm:py-15 lg:py-24.5 pl-4 sm:pl-7.5 lg:pl-12.5">
              <div className="mb-7.5 flex flex-wrap items-center gap-3">
                <span className="block font-semibold text-heading-3 text-blue sm:text-heading-1">{formatPKR(product.discountedPrice)}</span>
                {product.discountedPrice < product.price && (
                  <>
                    <span className="text-dark-4 line-through">{formatPKR(product.price)}</span>
                    <span className="rounded-full bg-red/10 px-2.5 py-1 text-xs font-semibold text-red">{product.discountPercentage}% OFF</span>
                  </>
                )}
              </div>
              <h1 className="font-semibold text-dark text-xl sm:text-3xl mb-3"><Link href={`/shop-details?id=${product.id}`}>{product.title}</Link></h1>
              <p className="line-clamp-3">{product.description}</p>
              <Link href={`/shop-details?id=${product.id}`} className="inline-flex font-medium text-white text-custom-sm rounded-md bg-dark py-3 px-9 ease-out duration-200 hover:bg-blue mt-10">Shop Now</Link>
            </div>
            <div className="flex-1 flex justify-center p-6">
              <Image src={product.image} alt={product.title} width={351} height={358} className="max-h-[358px] w-auto object-contain" style={{ width: "auto", height: "auto" }} priority />
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default HeroCarousel;
