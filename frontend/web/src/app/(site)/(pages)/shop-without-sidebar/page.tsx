import { Suspense } from "react";
import { Metadata } from "next";
import ShopWithoutSidebar from "@/components/ShopWithoutSidebar";

export const metadata: Metadata = {
  title: "Shop Page | AliBazaar",
  description: "Browse products from the live catalog.",
};

export default function ShopWithoutSidebarPage() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <ShopWithoutSidebar />
      </Suspense>
    </main>
  );
}
