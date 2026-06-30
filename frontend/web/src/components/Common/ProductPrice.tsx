import { formatPKR } from "@/lib/currency";

const ProductPrice = ({
  price,
  discountedPrice,
  discountPercentage,
  large = false,
}: {
  price: number;
  discountedPrice: number;
  discountPercentage?: number;
  large?: boolean;
}) => {
  const hasDiscount = price > 0 && discountedPrice >= 0 && discountedPrice < price;
  const calculatedPercentage = hasDiscount && price > 0
    ? ((price - discountedPrice) / price) * 100
    : 0;
  const percentage = discountPercentage && discountPercentage > 0
    ? discountPercentage
    : calculatedPercentage;
  const discountLabel = Number.isInteger(percentage)
    ? String(percentage)
    : percentage.toFixed(1).replace(/\.0$/, "");

  return (
    <span className={`flex flex-wrap items-center gap-2 font-medium ${large ? "text-xl xl:text-heading-4" : "text-lg"}`}>
      <span className={hasDiscount ? "text-green" : "text-dark"}>
        {formatPKR(hasDiscount ? discountedPrice : price)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-dark-4 line-through">{formatPKR(price)}</span>
          <span className="rounded-full bg-red/10 px-2.5 py-1 text-xs font-semibold leading-none text-red">
            {discountLabel}% OFF
          </span>
        </>
      )}
    </span>
  );
};

export default ProductPrice;
