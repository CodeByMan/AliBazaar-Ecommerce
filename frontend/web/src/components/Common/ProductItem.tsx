"use client";

import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { addItemToCart } from "@/redux/features/cart-slice";
import { updateproductDetails } from "@/redux/features/product-details";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { AppDispatch } from "@/redux/store";
import { Product } from "@/types/product";
import ProductPrice from "./ProductPrice";
import ProductRating from "./ProductRating";
import { QuickViewIcon, WishlistIcon } from "./ProductActionIcons";

const ProductItem = ({ item }: { item: Product }) => {
  const { openModal } = useModalContext();
  const dispatch = useDispatch<AppDispatch>();
  const detailsHref = `/shop-details?id=${item.id}`;

  const handleQuickView = () => {
    dispatch(updateQuickView(item));
    openModal();
  };

  const handleDetails = () => dispatch(updateproductDetails(item));

  return (
    <div className="group">
      <div className="relative overflow-hidden flex items-center justify-center rounded-lg bg-[#F6F7FB] min-h-[270px] mb-4 p-4">
        <Image
          src={item.image}
          alt={item.title}
          width={250}
          height={250}
          className="max-h-[250px] w-auto object-contain" style={{ width: "auto", height: "auto" }}
        />

        <div className="absolute left-0 bottom-0 translate-y-full w-full flex items-center justify-center gap-2.5 pb-5 ease-linear duration-200 group-hover:translate-y-0">
          <button
            type="button"
            onClick={handleQuickView}
            aria-label={`Quick view ${item.title}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-white text-dark shadow-1 ease-out duration-200 hover:text-blue"
          >
            <QuickViewIcon />
          </button>

          <button
            type="button"
            disabled={item.stock <= 0}
            onClick={() => dispatch(addItemToCart({ ...item, quantity: 1 }))}
            className="inline-flex whitespace-nowrap rounded-[5px] bg-blue px-5 py-[7px] text-custom-sm font-medium text-white ease-out duration-200 hover:bg-blue-dark disabled:cursor-not-allowed disabled:bg-gray-4"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-white text-dark shadow-1 ease-out duration-200 hover:text-blue"
          >
            <WishlistIcon />
          </button>
        </div>
      </div>

      <ProductRating rating={item.rating} reviews={item.reviews} />

      <h3 className="font-medium text-dark ease-out duration-200 hover:text-blue mt-2 mb-1.5">
        <Link href={detailsHref} onClick={handleDetails}>{item.title}</Link>
      </h3>

      <ProductPrice price={item.price} discountedPrice={item.discountedPrice} discountPercentage={item.discountPercentage} />
    </div>
  );
};

export default ProductItem;
