import type { Testimonial } from "@/types/testimonial";
import Image from "next/image";
import Link from "next/link";
import ProductRating from "@/components/Common/ProductRating";

const SingleItem = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <article className="m-1 flex h-full flex-col rounded-[10px] bg-white px-4 py-7.5 shadow-testimonial sm:px-8.5">
      <ProductRating rating={testimonial.rating} showCount={false} size={15} />

      <p className="mb-6 mt-5 line-clamp-4 flex-1 text-dark">
        {testimonial.review}
      </p>

      <div className="flex items-center gap-4">
        <div className="h-12.5 w-12.5 shrink-0 overflow-hidden rounded-full bg-gray-2">
          <Image
            src={testimonial.authorImg}
            alt={testimonial.authorName}
            className="h-12.5 w-12.5 rounded-full object-cover"
            width={50}
            height={50}
          />
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-medium text-dark">
            {testimonial.authorName}
          </h3>
          {testimonial.productId > 0 ? (
            <Link
              href={`/shop-details?id=${testimonial.productId}`}
              className="line-clamp-1 text-custom-sm text-blue hover:underline"
            >
              Reviewed {testimonial.productName}
            </Link>
          ) : (
            <p className="text-custom-sm">Verified customer review</p>
          )}
        </div>
      </div>
    </article>
  );
};

export default SingleItem;
