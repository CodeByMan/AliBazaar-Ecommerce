"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { SwiperRef } from "swiper/react";
import "swiper/css/navigation";
import "swiper/css";
import SingleItem from "./SingleItem";
import { getTestimonials } from "@/lib/api/reviews";
import type { Testimonial } from "@/types/testimonial";

const RETRY_DELAY = 4000;

const Testimonials = () => {
  const sliderRef = useRef<SwiperRef>(null);
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const testimonials = await getTestimonials(12, controller.signal);
        if (!disposed) setItems(testimonials);
      } catch (error) {
        if (disposed || (error instanceof Error && error.name === "AbortError")) {
          return;
        }
        retryTimer = setTimeout(() => {
          if (!disposed) setReloadKey((value) => value + 1);
        }, RETRY_DELAY);
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void load();
    const retryNow = () => setReloadKey((value) => value + 1);
    window.addEventListener("online", retryNow);
    window.addEventListener("focus", retryNow);

    return () => {
      disposed = true;
      controller.abort();
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("online", retryNow);
      window.removeEventListener("focus", retryNow);
    };
  }, [reloadKey]);

  const handlePrev = useCallback(() => {
    sliderRef.current?.swiper.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    sliderRef.current?.swiper.slideNext();
  }, []);

  return (
    <section className="overflow-hidden pb-16.5">
      <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
        <div className="swiper testimonial-carousel common-carousel p-1 sm:p-5">
          <div className="mb-10 flex items-center justify-between gap-4">
            <div>
              <span className="mb-1.5 flex items-center gap-2.5 font-medium text-dark">
                <Image
                  src="/images/icons/icon-08.svg"
                  alt=""
                  width={17}
                  height={17}
                />
                Testimonials
              </span>
              <h2 className="font-semibold text-xl text-dark xl:text-heading-5">
                Verified Customer Reviews
              </h2>
            </div>

            {items.length > 1 && (
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="swiper-button-prev"
                  aria-label="Previous testimonial"
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="swiper-button-next"
                  aria-label="Next testimonial"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[260px] animate-pulse rounded-[10px] bg-gray-2"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[10px] bg-white p-8 text-center shadow-testimonial">
              Customer testimonials will appear here after verified product reviews are submitted.
            </div>
          ) : (
            <Swiper
              ref={sliderRef}
              slidesPerView={1}
              spaceBetween={20}
              breakpoints={{
                768: { slidesPerView: 2 },
                1200: { slidesPerView: 3 },
              }}
            >
              {items.map((item) => (
                <SwiperSlide key={item.id} className="h-auto">
                  <SingleItem testimonial={item} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
