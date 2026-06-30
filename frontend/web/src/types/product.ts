export type ProductReview = {
  id: number;
  review: string;
  feedback?: string;
  rating: number;
  image?: string;
  reviewedAt: string;
  userName: string;
};

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  stock: number;
  reviews: number;
  rating: number;
  price: number;
  discountedPrice: number;
  discountEnabled?: boolean;
  discountPercentage?: number;
  image: string;
  imgs: {
    thumbnails: string[];
    previews: string[];
  };
  reviewItems?: ProductReview[];
};

export type ProductCategory = {
  name: string;
  products: number;
};
