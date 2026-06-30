import { Suspense } from "react";
import type { Metadata } from "next";
import ShopWithSidebar from "@/components/ShopWithSidebar";

export const metadata: Metadata = {
  title: "Shop Products Online",
  description:
    "Browse AliBazaar products by category, search the live catalog, compare ratings, and shop online in Pakistan.",
  alternates: { canonical: "/shop-with-sidebar" },
};

export default function ShopWithSidebarPage() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <ShopWithSidebar />
      </Suspense>
    </main>
  );
}
