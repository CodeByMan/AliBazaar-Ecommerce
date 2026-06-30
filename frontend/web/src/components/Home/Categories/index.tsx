"use client";

import { useCallback, useMemo, useRef } from "react";
import { Swiper, SwiperSlide, type SwiperRef } from "swiper/react";
import "swiper/css";

import SingleItem from "./SingleItem";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import {
  getUploadedImageUrl,
  type ApiCategoryItem,
} from "@/lib/api/products";

const Categories = ({
  categories,
  categoryItems,
  products,
  loading,
}: {
  categories: string[];
  categoryItems: ApiCategoryItem[];
  products: Product[];
  loading: boolean;
}) => {
  const sliderRef = useRef<SwiperRef>(null);

  const items = useMemo<Category[]>(() => {
    const source = categoryItems.length
      ? categoryItems
      : categories.map((name, index) => ({
          id: index + 1,
          name,
          slug: name,
          image: null,
        }));

    return source.map((category) => ({
      id: category.id,
      title: category.name,
      img: getUploadedImageUrl(
        category.image,
        products.find((product) => product.category === category.name)?.image ||
          "/images/categories/categories-01.png",
      ),
      products:
        category.productCount ??
        products.filter((product) => product.category === category.name).length,
      href: `/shop-with-sidebar?category=${encodeURIComponent(
        category.name,
      )}`,
    }));
  }, [categories, categoryItems, products]);

  /*
   * Swiper loop mode needs more slides than the maximum number of
   * visible slides. The desktop layout displays up to seven slides,
   * so the items are repeated until there are at least fourteen.
   */
  const loopItems = useMemo(() => {
    if (items.length === 0) {
      return [];
    }

    const minimumSlides = 14;
    const repeatedItems: Array<Category & { loopKey: string }> = [];

    while (repeatedItems.length < minimumSlides) {
      items.forEach((item, index) => {
        repeatedItems.push({
          ...item,
          loopKey: `${item.id}-${repeatedItems.length}-${index}`,
        });
      });
    }

    return repeatedItems;
  }, [items]);

  const handlePrev = useCallback(() => {
    sliderRef.current?.swiper?.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    sliderRef.current?.swiper?.slideNext();
  }, []);

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden pt-17.5">
      <div className="mx-auto w-full max-w-[1170px] border-b border-gray-3 px-4 pb-15 sm:px-8 xl:px-0">
        <div className="categories-carousel common-carousel">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="mb-1.5 flex items-center gap-2.5 font-medium text-dark">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3.94024 13.4474C2.6523 12.1595 2.00832 11.5155 1.7687 10.68C1.52908 9.84449 1.73387 8.9571 2.14343 7.18231L2.37962 6.15883C2.72419 4.66569 2.89648 3.91912 3.40771 3.40789C3.91894 2.89666 4.66551 2.72437 6.15865 2.3798L7.18213 2.14361C8.95692 1.73405 9.84431 1.52927 10.6798 1.76889C11.5153 2.00851 12.1593 2.65248 13.4472 3.94042L14.9719 5.46512C17.2128 7.70594 18.3332 8.82635 18.3332 10.2186C18.3332 11.6109 17.2128 12.7313 14.9719 14.9721C12.7311 17.2129 11.6107 18.3334 10.2184 18.3334C8.82617 18.3334 7.70576 17.2129 5.46494 14.9721L3.94024 13.4474Z"
                    stroke="#3C50E0"
                    strokeWidth="1.5"
                  />

                  <circle
                    cx="7.17245"
                    cy="7.39917"
                    r="1.66667"
                    transform="rotate(-45 7.17245 7.39917)"
                    stroke="#3C50E0"
                    strokeWidth="1.5"
                  />
                </svg>

                Categories
              </span>

              <h2 className="text-xl font-semibold text-dark xl:text-heading-5">
                Browse by Category
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Show previous categories"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-3 bg-white text-blue shadow-sm transition hover:border-blue hover:bg-blue hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:h-11 sm:w-11"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <path
                    d="M12.5 15L7.5 10L12.5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Show next categories"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-3 bg-white text-blue shadow-sm transition hover:border-blue hover:bg-blue hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:h-11 sm:w-11"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <path
                    d="M7.5 5L12.5 10L7.5 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-7">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse flex-col items-center"
                >
                  <div className="mb-4 h-32 w-32 rounded-full bg-gray-2" />
                  <div className="h-4 w-24 rounded bg-gray-2" />
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              ref={sliderRef}
              loop={loopItems.length > 1}
              loopAdditionalSlides={loopItems.length}
              slidesPerView={2}
              slidesPerGroup={1}
              spaceBetween={16}
              speed={450}
              allowTouchMove
              simulateTouch
              grabCursor
              watchOverflow={false}
              resistance
              resistanceRatio={0.85}
              threshold={5}
              breakpoints={{
                480: {
                  slidesPerView: 2.5,
                  spaceBetween: 18,
                },
                640: {
                  slidesPerView: 3,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 4,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 6,
                  spaceBetween: 20,
                },
                1280: {
                  slidesPerView: 7,
                  spaceBetween: 20,
                },
              }}
            >
              {loopItems.map((item) => (
                <SwiperSlide key={item.loopKey}>
                  <SingleItem item={item} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;