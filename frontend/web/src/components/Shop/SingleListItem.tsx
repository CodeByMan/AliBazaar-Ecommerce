"use client";

import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { addItemToCart } from "@/redux/features/cart-slice";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { AppDispatch } from "@/redux/store";
import { Product } from "@/types/product";
import ProductPrice from "@/components/Common/ProductPrice";
import ProductRating from "@/components/Common/ProductRating";
import { QuickViewIcon, WishlistIcon } from "@/components/Common/ProductActionIcons";

const SingleListItem = ({ item }: { item: Product }) => {
  const { openModal } = useModalContext();
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="group rounded-lg bg-white shadow-1">
      <div className="flex flex-col sm:flex-row">
        <div className="shadow-list relative overflow-hidden flex items-center justify-center max-w-[270px] w-full sm:min-h-[270px] p-4 mx-auto sm:mx-0">
          <Image src={item.image} alt={item.title} width={250} height={250} className="max-h-[250px] w-auto object-contain" style={{ width: "auto", height: "auto" }} />
          <div className="absolute left-0 bottom-0 translate-y-full w-full flex items-center justify-center gap-2.5 pb-5 ease-linear duration-200 group-hover:translate-y-0">
            <button type="button" onClick={() => { dispatch(updateQuickView(item)); openModal(); }} aria-label={`Quick view ${item.title}`} className="flex items-center justify-center w-9 h-9 rounded-[5px] shadow-1 text-dark bg-white hover:text-blue"><QuickViewIcon /></button>
            <button type="button" disabled={item.stock <= 0} onClick={() => dispatch(addItemToCart({ ...item, quantity: 1 }))} className="inline-flex font-medium text-custom-sm py-[7px] px-5 rounded-[5px] bg-blue text-white hover:bg-blue-dark disabled:bg-gray-4 disabled:cursor-not-allowed">{item.stock > 0 ? "Add to cart" : "Out of stock"}</button>
            <button type="button" onClick={() => dispatch(addItemToWishlist({ ...item, status: item.stock > 0 ? "available" : "unavailable", quantity: 1 }))} aria-label={`Add ${item.title} to wishlist`} className="flex items-center justify-center w-9 h-9 rounded-[5px] shadow-1 text-dark bg-white hover:text-blue"><WishlistIcon /></button>
          </div>
        </div>
        <div className="w-full flex flex-col gap-5 sm:flex-row sm:items-center justify-center sm:justify-between py-5 px-4 sm:px-7.5 lg:pl-11 lg:pr-12">
          <div className="max-w-xl">
            <h3 className="font-medium text-dark ease-out duration-200 hover:text-blue mb-1.5"><Link href={`/shop-details?id=${item.id}`}>{item.title}</Link></h3>
            <p className="text-custom-sm mb-3 line-clamp-2">{item.description}</p>
            <ProductPrice price={item.price} discountedPrice={item.discountedPrice} discountPercentage={item.discountPercentage} />
          </div>
          <div className="flex flex-col gap-2.5">
            <ProductRating rating={item.rating} reviews={item.reviews} size={15} />
            <span className={`text-custom-sm font-medium ${item.stock > 0 ? "text-green" : "text-red"}`}>{item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleListItem;
