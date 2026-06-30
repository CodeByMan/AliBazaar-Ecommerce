import Image from "next/image";

type ProductRatingProps = {
  rating?: number;
  reviews?: number;
  size?: number;
  showCount?: boolean;
};

const ProductRating = ({
  rating = 0,
  reviews = 0,
  size = 14,
  showCount = true,
}: ProductRatingProps) => {
  const safeRating = Number.isFinite(rating)
    ? Math.min(5, Math.max(0, rating))
    : 0;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div
        className="flex items-center gap-1"
        aria-label={`${safeRating.toFixed(1)} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const fill = Math.min(100, Math.max(0, (safeRating - index) * 100));
          return (
            <span
              key={index}
              className="relative inline-block shrink-0"
              style={{ width: size, height: size }}
              aria-hidden="true"
            >
              <Image
                src="/images/icons/icon-star-empty.svg"
                alt=""
                fill
                sizes={`${size}px`}
              />
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill}%` }}
              >
                <span className="relative block" style={{ width: size, height: size }}>
                  <Image
                    src="/images/icons/icon-star.svg"
                    alt=""
                    fill
                    sizes={`${size}px`}
                  />
                </span>
              </span>
            </span>
          );
        })}
      </div>
      {showCount && (
        <p className="text-custom-sm">
          {reviews > 0 ? `${safeRating.toFixed(1)} (${reviews})` : "No reviews"}
        </p>
      )}
    </div>
  );
};

export default ProductRating;
