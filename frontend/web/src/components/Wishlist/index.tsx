"use client";

import Breadcrumb from "../Common/Breadcrumb";
import { useAppSelector, AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import { removeAllItemsFromWishlist } from "@/redux/features/wishlist-slice";
import SingleItem from "./SingleItem";

export const Wishlist = () => {
  const dispatch = useDispatch<AppDispatch>();
  const wishlistItems = useAppSelector((state) => state.wishlistReducer.items);

  return (
    <>
      <Breadcrumb title="Wishlist" pages={["Wishlist"]} />
      <section className="overflow-hidden bg-gray-2 py-12 sm:py-20">
        <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
          <div className="mb-7.5 flex flex-wrap items-center justify-between gap-5">
            <h2 className="text-2xl font-medium text-dark">Your Wishlist</h2>
            {wishlistItems.length > 0 && (
              <button type="button" onClick={() => dispatch(removeAllItemsFromWishlist())} className="text-blue hover:underline">
                Clear Wishlist
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-[10px] bg-white shadow-1">
            {wishlistItems.length > 0 ? (
              wishlistItems.map((item) => <SingleItem item={item} key={item.id} />)
            ) : (
              <div className="px-6 py-16 text-center text-dark-4">Your wishlist is empty.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
