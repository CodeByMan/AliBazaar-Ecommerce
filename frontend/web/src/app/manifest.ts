import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AliBazaar",
    short_name: "AliBazaar",
    description: "Online shopping in Pakistan with PKR pricing and verified reviews.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3C50E0",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
