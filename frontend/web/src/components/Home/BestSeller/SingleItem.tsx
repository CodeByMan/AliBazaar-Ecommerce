"use client";

import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import ProductPrice from "@/components/Common/ProductPrice";
import ProductRating from "@/components/Common/ProductRating";
import {
  QuickViewIcon,
  WishlistIcon,
} from "@/components/Common/ProductActionIcons";
import { addItemToCart } from "@/redux/features/cart-slice";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { AppDispatch } from "@/redux/store";
import { Product } from "@/types/product";

const SingleItem = ({ item }: { item: Product }) => {
  const { openModal } = useModalContext();
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="group h-full">
      <div className="relative flex h-full min-h-[430px] flex-col overflow-hidden rounded-lg border border-gray-3 bg-[#F6F7FB] shadow-1 transition-shadow duration-200 hover:shadow-2">
        <div className="flex min-h-[138px] flex-col items-center px-5 pb-3 pt-6 text-center">
          <div className="mb-2 flex min-h-5 items-center justify-center">
            <ProductRating rating={item.rating} reviews={item.reviews} />
          </div>

          <h3 className="mb-2 line-clamp-2 min-h-12 font-medium leading-6 text-dark transition-colors duration-200 hover:text-blue">
            <Link href={`/shop-details?id=${item.id}`}>{item.title}</Link>
          </h3>

          <div className="mt-auto flex min-h-7 items-center justify-center text-center">
            <ProductPrice
              price={item.price}
              discountedPrice={item.discountedPrice} discountPercentage={item.discountPercentage}
            />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 pt-2">
          <Image
            src={item.image}
            alt={item.title}
            width={280}
            height={280}
            className="max-h-[250px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        <div className="absolute bottom-0 left-0 flex w-full translate-y-full items-center justify-center gap-2.5 pb-5 transition-transform duration-200 ease-linear group-hover:translate-y-0">
          <button
            type="button"
            onClick={() => {
              dispatch(updateQuickView(item));
              openModal();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-white text-dark shadow-1 transition-colors duration-200 hover:text-blue"
            aria-label={`Quick view ${item.title}`}
          >
            <QuickViewIcon />
          </button>

          <button
            type="button"
            disabled={item.stock <= 0}
            onClick={() =>
              dispatch(addItemToCart({ ...item, quantity: 1 }))
            }
            className="inline-flex whitespace-nowrap rounded-[5px] bg-blue px-5 py-[7px] text-custom-sm font-medium text-white transition-colors duration-200 hover:bg-blue-dark disabled:cursor-not-allowed disabled:bg-gray-4"
          >
            {item.stock > 0 ? "Add to cart" : "Out of stock"}
          </button>

          <button
            type="button"
            onClick={() =>
              dispatch(
                addItemToWishlist({
                  ...item,
                  status: item.stock > 0 ? "available" : "unavailable",
                  quantity: 1,
                }),
              )
            }
            aria-label={`Add ${item.title} to wishlist`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-white text-dark shadow-1 transition-colors duration-200 hover:text-blue"
          >
            <WishlistIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleItem;
