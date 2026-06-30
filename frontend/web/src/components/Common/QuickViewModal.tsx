"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { useProductDetails } from "@/hooks/useProducts";
import { addItemToCart } from "@/redux/features/cart-slice";
import { updateproductDetails } from "@/redux/features/product-details";
import { resetQuickView } from "@/redux/features/quickView-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import ProductPrice from "./ProductPrice";
import ProductRating from "./ProductRating";

const QuickViewModal = () => {
  const { isModalOpen, closeModal } = useModalContext();
  const selectedProduct = useAppSelector((state) => state.quickViewReducer.value);
  const { data, loading } = useProductDetails(isModalOpen ? selectedProduct.id : undefined);
  const product = data?.product || selectedProduct;
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => setQuantity(1), [selectedProduct.id]);

  const handleClose = () => {
    closeModal();
    dispatch(resetQuickView());
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-dark/70 px-4 py-8" role="dialog" aria-modal="true" aria-label="Product quick view">
      <button type="button" onClick={handleClose} className="absolute inset-0 cursor-default" aria-label="Close quick view" />
      <div className="relative z-10 max-w-[1100px] w-full max-h-full overflow-y-auto rounded-xl bg-white shadow-2 p-4 sm:p-7.5">
        <button type="button" onClick={handleClose} aria-label="Close quick view" className="absolute top-3 right-3 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-gray-1 text-dark hover:text-red">×</button>

        {loading && selectedProduct.id > 0 ? (
          <div className="min-h-[420px] animate-pulse grid md:grid-cols-2 gap-8"><div className="rounded-lg bg-gray-2" /><div className="space-y-5 pt-10"><div className="h-8 bg-gray-2 rounded" /><div className="h-5 bg-gray-2 rounded w-1/2" /><div className="h-24 bg-gray-2 rounded" /></div></div>
        ) : product.id <= 0 ? (
          <div className="py-20 text-center">Product information is unavailable.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="rounded-lg bg-gray-2 min-h-[420px] flex items-center justify-center p-6">
              <Image src={product.image} alt={product.title} width={420} height={420} className="max-h-[400px] w-auto object-contain" style={{ width: "auto", height: "auto" }} />
            </div>
            <div className="py-5">
              <h2 className="font-semibold text-2xl text-dark mb-3">{product.title}</h2>
              <div className="flex flex-wrap items-center gap-5 mb-5"><ProductRating rating={product.rating} reviews={product.reviews} size={17} /><span className={`font-medium ${product.stock > 0 ? "text-green" : "text-red"}`}>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span></div>
              <p className="mb-5 line-clamp-4">{product.description}</p>
              <p className="mb-5"><span className="font-medium text-dark">Category:</span> {product.category}</p>
              <div className="mb-7"><ProductPrice price={product.price} discountedPrice={product.discountedPrice} discountPercentage={product.discountPercentage} large /></div>

              <div className="flex items-center gap-3 mb-7">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="flex items-center justify-center w-10 h-10 rounded-[5px] bg-gray-2 disabled:opacity-50">−</button>
                <span className="flex items-center justify-center w-20 h-10 rounded-[5px] border border-gray-4 font-medium text-dark">{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} disabled={quantity >= product.stock} className="flex items-center justify-center w-10 h-10 rounded-[5px] bg-gray-2 disabled:opacity-50">+</button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button type="button" disabled={product.stock <= 0} onClick={() => dispatch(addItemToCart({ ...product, quantity }))} className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md hover:bg-blue-dark disabled:bg-gray-4 disabled:cursor-not-allowed">{product.stock > 0 ? "Add to Cart" : "Out of Stock"}</button>
                <button type="button" onClick={() => dispatch(addItemToWishlist({ ...product, status: product.stock > 0 ? "available" : "unavailable", quantity: 1 }))} className="inline-flex font-medium text-white bg-dark py-3 px-6 rounded-md">♡ Wishlist</button>
                <Link href={`/shop-details?id=${product.id}`} onClick={() => { dispatch(updateproductDetails(product)); handleClose(); }} className="inline-flex font-medium text-blue py-3 px-2">View details</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickViewModal;
