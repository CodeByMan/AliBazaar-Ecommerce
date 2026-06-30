import type { Testimonial } from "@/types/testimonial";

// Legacy fallback data retained only for compatibility. The homepage now loads
// live testimonials from the reviews API instead of importing this array.
const testimonialsData: Testimonial[] = [
  {
    id: 1,
    review: "A verified AliBazaar customer review will appear here.",
    rating: 5,
    authorName: "Verified customer",
    authorImg: "/images/users/user-01.jpg",
    productId: 0,
    productName: "AliBazaar product",
    reviewedAt: new Date(0).toISOString(),
  },
];

export default testimonialsData;
