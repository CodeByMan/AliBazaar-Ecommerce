import Home from "@/components/Home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Shopping in Pakistan",
  description:
    "Shop electronics, fashion, accessories, home products, and more online from AliBazaar with PKR pricing, verified reviews, coupons, wishlists, and order tracking.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <Home />;
}
