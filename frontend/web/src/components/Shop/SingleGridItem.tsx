"use client";

import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { addItemToCart } from "@/redux/features/cart-slice";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import type { AppDispatch } from "@/redux/store";
import type { Product } from "@/types/product";
import ProductPrice from "@/components/Common/ProductPrice";
import ProductRating from "@/components/Common/ProductRating";
import { QuickViewIcon, WishlistIcon } from "@/components/Common/ProductActionIcons";

const SingleGridItem = ({ item }: { item: Product }) => {
  const { openModal } = useModalContext();
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="group">
      <div className="relative overflow-hidden flex items-center justify-center rounded-lg bg-white shadow-1 min-h-[270px] mb-4 p-4">
        <Image src={item.image} alt={item.title} width={250} height={250} className="max-h-[250px] w-auto object-contain" style={{ width: "auto", height: "auto" }} />
        <div className="absolute left-0 bottom-0 translate-y-full w-full flex items-center justify-center gap-2.5 pb-5 ease-linear duration-200 group-hover:translate-y-0">
          <button type="button" onClick={() => { dispatch(updateQuickView(item)); openModal(); }} aria-label={`Quick view ${item.title}`} className="flex items-center justify-center w-9 h-9 rounded-[5px] shadow-1 ease-out duration-200 text-dark bg-white hover:text-blue"><QuickViewIcon /></button>
          <button type="button" disabled={item.stock <= 0} onClick={() => dispatch(addItemToCart({ ...item, quantity: 1 }))} className="inline-flex font-medium text-custom-sm py-[7px] px-5 rounded-[5px] bg-blue text-white ease-out duration-200 hover:bg-blue-dark disabled:bg-gray-4 disabled:cursor-not-allowed">{item.stock > 0 ? "Add to cart" : "Out of stock"}</button>
          <button type="button" onClick={() => dispatch(addItemToWishlist({ ...item, status: item.stock > 0 ? "available" : "unavailable", quantity: 1 }))} aria-label={`Add ${item.title} to wishlist`} className="flex items-center justify-center w-9 h-9 rounded-[5px] shadow-1 ease-out duration-200 text-dark bg-white hover:text-blue"><WishlistIcon /></button>
        </div>
      </div>
      <ProductRating rating={item.rating} reviews={item.reviews} size={15} />
      <h3 className="font-medium text-dark ease-out duration-200 hover:text-blue mt-2 mb-1.5"><Link href={`/shop-details?id=${item.id}`}>{item.title}</Link></h3>
      <ProductPrice price={item.price} discountedPrice={item.discountedPrice} discountPercentage={item.discountPercentage} />
    </div>
  );
};

export default SingleGridItem;
