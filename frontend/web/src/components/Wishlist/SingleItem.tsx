"use client";

import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  WishListItem,
  removeItemFromWishlist,
} from "@/redux/features/wishlist-slice";
import { addItemToCart } from "@/redux/features/cart-slice";
import { formatPKR } from "@/lib/currency";

const SingleItem = ({ item }: { item: WishListItem }) => {
  const dispatch = useDispatch<AppDispatch>();
  const image =
    item.image || item.imgs?.thumbnails?.[0] || "/images/placeholder.png";

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-4 border-t border-gray-3 px-4 py-5 sm:grid-cols-[90px_minmax(0,1fr)] sm:px-7.5 lg:grid-cols-[90px_minmax(220px,1fr)_140px_140px_minmax(230px,auto)] lg:gap-6">
      <div className="flex h-20 w-[72px] items-center justify-center overflow-hidden rounded-md bg-gray-2 sm:h-22.5 sm:w-[90px]">
        <Image
          src={image}
          alt={item.title}
          width={90}
          height={90}
          className="max-h-full w-auto object-contain"
        />
      </div>

      <div className="min-w-0">
        <Link
          href={`/shop-details?id=${item.id}`}
          className="line-clamp-2 font-medium text-dark hover:text-blue"
        >
          {item.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 lg:hidden">
          <p>{formatPKR(item.discountedPrice)}</p>
          <p className={item.stock > 0 ? "text-green" : "text-red"}>
            {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
          </p>
        </div>
      </div>

      <p className="hidden text-dark lg:block">
        {formatPKR(item.discountedPrice)}
      </p>

      <p
        className={`hidden font-medium lg:block ${
          item.stock > 0 ? "text-green" : "text-red"
        }`}
      >
        {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
      </p>

      <div className="col-span-2 flex min-w-0 flex-nowrap items-center gap-2 sm:col-start-2 sm:col-span-1 lg:col-start-auto lg:col-span-1 lg:justify-end">
        <button
          type="button"
          onClick={() => dispatch(removeItemFromWishlist(item.id))}
          aria-label={`Remove ${item.title} from wishlist`}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-gray-3 bg-white px-3 text-sm font-medium text-red transition-colors hover:border-red hover:bg-red-light-6 lg:flex-none lg:px-4"
        >
          Remove
        </button>

        <button
          type="button"
          disabled={item.stock <= 0}
          onClick={() => dispatch(addItemToCart({ ...item, quantity: 1 }))}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-blue px-3 text-sm font-medium text-white transition-colors hover:bg-blue-dark disabled:cursor-not-allowed disabled:bg-gray-4 lg:flex-none lg:px-4"
        >
          {item.stock > 0 ? "Add to Cart" : "Unavailable"}
        </button>
      </div>
    </article>
  );
};

export default SingleItem;
