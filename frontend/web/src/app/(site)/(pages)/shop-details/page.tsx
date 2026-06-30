import { Suspense } from "react";
import type { Metadata } from "next";
import ShopDetails from "@/components/ShopDetails";
import { getProductDetails } from "@/lib/api/products";

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { id } = await searchParams;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return {
      title: "Product Details",
      description: "View AliBazaar product information, pricing, stock, and verified customer reviews.",
      robots: { index: false, follow: true },
    };
  }

  try {
    const { product } = await getProductDetails(productId);
    const description = product.description.trim().slice(0, 160);
    return {
      title: product.title,
      description,
      alternates: { canonical: `/shop-details?id=${product.id}` },
      openGraph: {
        type: "website",
        title: product.title,
        description,
        images: product.imgs.previews.map((url) => ({ url, alt: product.title })),
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description,
        images: product.imgs.previews.slice(0, 1),
      },
    };
  } catch {
    return {
      title: "Product Details",
      description: "View AliBazaar product information, pricing, stock, and verified customer reviews.",
      alternates: { canonical: `/shop-details?id=${productId}` },
    };
  }
}

export default function ShopDetailsPage() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <ShopDetails />
      </Suspense>
    </main>
  );
}
