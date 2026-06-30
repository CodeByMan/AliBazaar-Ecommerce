import type { Metadata } from "next";
import "../css/euclid-circular-a-font.css";
import "../css/style.css";
import SiteShell from "@/components/SiteShell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AliBazaar | Online Shopping in Pakistan",
    template: "%s | AliBazaar",
  },
  description:
    "Shop electronics, fashion, accessories, home products, and more online from AliBazaar with PKR pricing, secure checkout, coupons, wishlists, verified reviews, and order tracking.",
  applicationName: "AliBazaar",
  keywords: [
    "AliBazaar",
    "online shopping Pakistan",
    "Pakistan ecommerce",
    "buy products online",
    "electronics",
    "fashion",
    "online marketplace",
    "PKR shopping",
  ],
  authors: [{ name: "AliBazaar" }],
  creator: "AliBazaar",
  publisher: "AliBazaar",
  category: "ecommerce",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteUrl,
    siteName: "AliBazaar",
    title: "AliBazaar | Online Shopping in Pakistan",
    description:
      "Discover products across popular categories with PKR pricing, wishlists, verified customer reviews, coupons, and order tracking.",
    images: [
      {
        url: "/images/banner/top-ad-banner.svg",
        width: 1600,
        height: 160,
        alt: "AliBazaar online shopping",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AliBazaar | Online Shopping in Pakistan",
    description:
      "Shop products online with PKR pricing, wishlists, verified reviews, coupons, and order tracking.",
    images: ["/images/banner/top-ad-banner.svg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AliBazaar",
  url: siteUrl,
  email: "info@alibazaar.com",
  logo: `${siteUrl}/images/logo/logo.svg`,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AliBazaar",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/shop-with-sidebar?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PK" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
