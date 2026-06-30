"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import Breadcrumb from "../Common/Breadcrumb";
import Newsletter from "../Common/Newsletter";
import ProductPrice from "../Common/ProductPrice";
import ProductRating from "../Common/ProductRating";
import { ProductLoadError } from "../Common/ProductStates";
import RecentlyViewdItems from "./RecentlyViewd";
import { usePreviewSlider } from "@/app/context/PreviewSliderContext";
import { useProductDetails } from "@/hooks/useProducts";
import { addItemToCart } from "@/redux/features/cart-slice";
import { updateproductDetails } from "@/redux/features/product-details";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { AppDispatch } from "@/redux/store";
import { addRecentlyViewed } from "@/lib/recently-viewed";

const ShopDetails = () => {
  const searchParams = useSearchParams();
  const productId = Number(searchParams.get("id"));
  const { data, loading, error, retry } = useProductDetails(productId);
  const [previewImg, setPreviewImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "information" | "reviews">("description");
  const { openPreviewModal } = usePreviewSlider();
  const dispatch = useDispatch<AppDispatch>();
  const product = data?.product;

  useEffect(() => {
    if (!product) return;
    dispatch(updateproductDetails(product));
    addRecentlyViewed(product);
  }, [dispatch, product]);

  useEffect(() => {
    setPreviewImg(0);
    setQuantity(1);
  }, [productId]);

  const stockText = useMemo(() => {
    if (!product || product.stock <= 0) return "Out of stock";
    return `${product.stock} item${product.stock === 1 ? "" : "s"} available`;
  }, [product]);

  if (loading) {
    return (
      <>
        <Breadcrumb title="Shop Details" pages={["shop details"]} />
        <section className="pb-20 pt-20"><div className="max-w-[1170px] mx-auto px-4 animate-pulse grid lg:grid-cols-2 gap-10"><div className="min-h-[512px] rounded-lg bg-gray-2" /><div className="space-y-5"><div className="h-10 bg-gray-2 rounded" /><div className="h-5 bg-gray-2 rounded w-1/2" /><div className="h-32 bg-gray-2 rounded" /></div></div></section>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Breadcrumb title="Shop Details" pages={["shop details"]} />
        <section className="pb-20 pt-20"><div className="max-w-[1170px] mx-auto px-4"><ProductLoadError message={error || "Product not found."} onRetry={retry} /></div></section>
      </>
    );
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.imgs.previews,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.discountedPrice,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(product.reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviews,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Breadcrumb title={product.title} pages={["shop", "/", "shop details"]} />
      <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-17.5">
            <div className="lg:max-w-[570px] w-full">
              <div className="lg:min-h-[512px] rounded-lg shadow-1 bg-gray-2 p-4 sm:p-7.5 relative flex items-center justify-center">
                <button type="button" onClick={openPreviewModal} aria-label="Open product image preview" className="gallery__Image w-11 h-11 rounded-[5px] bg-gray-1 shadow-1 flex items-center justify-center text-dark hover:text-blue absolute top-4 lg:top-6 right-4 lg:right-6 z-50">⌕</button>
                <Image src={product.imgs.previews[previewImg] || product.image} alt={product.title} width={440} height={440} className="max-h-[440px] w-auto object-contain" style={{ width: "auto", height: "auto" }} priority />
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-4.5 mt-6">
                {product.imgs.thumbnails.map((image, index) => (
                  <button type="button" onClick={() => setPreviewImg(index)} key={image} className={`flex items-center justify-center w-15 sm:w-25 h-15 sm:h-25 overflow-hidden rounded-lg bg-gray-2 shadow-1 border-2 hover:border-blue ${index === previewImg ? "border-blue" : "border-transparent"}`}>
                    <Image width={70} height={70} src={image} alt={`${product.title} thumbnail ${index + 1}`} className="max-h-[70px] w-auto object-contain" style={{ width: "auto", height: "auto" }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-[539px] w-full">
              <h1 className="font-semibold text-xl sm:text-2xl xl:text-custom-3 text-dark mb-3">{product.title}</h1>
              <div className="flex flex-wrap items-center gap-5.5 mb-4.5">
                <ProductRating rating={product.rating} reviews={product.reviews} size={18} />
                <span className={`font-medium ${product.stock > 0 ? "text-green" : "text-red"}`}>{stockText}</span>
              </div>
              <p className="mb-6">{product.description}</p>
              <div className="flex items-center gap-3 mb-4"><span className="font-medium text-dark">Category:</span><span>{product.category}</span></div>
              <div className="mb-7.5"><h4 className="font-semibold text-lg text-dark mb-3.5">Price</h4><ProductPrice price={product.price} discountedPrice={product.discountedPrice} discountPercentage={product.discountPercentage} large /></div>

              <div className="flex flex-wrap items-end gap-5 mb-7.5">
                <div>
                  <h4 className="font-semibold text-lg text-dark mb-3.5">Quantity</h4>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="flex items-center justify-center w-10 h-10 rounded-[5px] bg-gray-2 text-dark hover:text-blue disabled:opacity-50">−</button>
                    <span className="flex items-center justify-center w-20 h-10 rounded-[5px] border border-gray-4 bg-white font-medium text-dark">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} disabled={quantity >= product.stock} className="flex items-center justify-center w-10 h-10 rounded-[5px] bg-gray-2 text-dark hover:text-blue disabled:opacity-50">+</button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button type="button" disabled={product.stock <= 0} onClick={() => dispatch(addItemToCart({ ...product, quantity }))} className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md hover:bg-blue-dark disabled:bg-gray-4 disabled:cursor-not-allowed">{product.stock > 0 ? "Add to Cart" : "Out of Stock"}</button>
                <button type="button" onClick={() => dispatch(addItemToWishlist({ ...product, status: product.stock > 0 ? "available" : "unavailable", quantity: 1 }))} className="inline-flex items-center gap-2 font-medium text-white bg-dark py-3 px-6 rounded-md hover:bg-opacity-95">♡ Add to Wishlist</button>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <div className="flex flex-wrap items-center gap-8 border-b border-gray-3">
              {[
                ["description", "Description"],
                ["information", "Additional Information"],
                ["reviews", `Reviews (${product.reviews})`],
              ].map(([id, label]) => (
                <button type="button" key={id} onClick={() => setActiveTab(id as typeof activeTab)} className={`relative font-medium py-4 before:absolute before:left-0 before:bottom-0 before:h-0.5 before:bg-blue before:duration-200 ${activeTab === id ? "text-blue before:w-full" : "text-dark before:w-0"}`}>{label}</button>
              ))}
            </div>

            {activeTab === "description" && (
              <div className="mt-10 max-w-[850px]"><h2 className="font-medium text-2xl text-dark mb-5">Product Description</h2><p className="whitespace-pre-line">{product.description}</p></div>
            )}

            {activeTab === "information" && (
              <div className="rounded-xl bg-white shadow-1 p-4 sm:p-6 mt-10">
                {[
                  ["Category", product.category],
                  ["Availability", stockText],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5"><div className="max-w-[450px] min-w-[140px] w-full"><p className="text-dark">{label}</p></div><div className="w-full"><p className="text-dark break-all">{value}</p></div></div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="mt-10">
                {data.reviews.length === 0 ? (
                  <div className="rounded-xl bg-white shadow-1 p-8 text-center">No reviews have been submitted for this product.</div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {data.reviews.map((review) => (
                      <article key={review.id} className="rounded-xl bg-white shadow-1 p-5 sm:p-7">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3"><div><h3 className="font-medium text-dark">{review.userName}</h3><p className="text-custom-sm">{new Date(review.reviewedAt).toLocaleDateString()}</p></div><ProductRating rating={review.rating} showCount={false} /></div>
                        <p>{review.review}</p>
                        {review.feedback && <p className="mt-2 rounded-md bg-gray-1 p-3 text-custom-sm text-dark-4"><strong className="text-dark">Additional feedback:</strong> {review.feedback}</p>}
                        {review.image && <Image src={review.image} alt="Customer review" width={180} height={180} className="mt-4 rounded-lg object-cover" />}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <RecentlyViewdItems product={product} />
      <Newsletter />
    </>
  );
};

export default ShopDetails;
