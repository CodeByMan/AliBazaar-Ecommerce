import type { Metadata } from "next";
import RecentlyViewed from "@/components/RecentlyViewed";

export const metadata: Metadata = {
  title: "Recently Viewed Products",
  description: "Return to products you recently viewed on AliBazaar.",
  robots: { index: false, follow: true },
};

export default function RecentlyViewedPage() {
  return <RecentlyViewed />;
}
