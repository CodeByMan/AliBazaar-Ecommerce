import Image from "next/image";

const featureData = [
  {
    img: "/images/icons/icon-01.svg",
    title: "Free Shipping",
    description: "On eligible orders",
  },
  {
    img: "/images/icons/icon-02.svg",
    title: "Easy Order Tracking",
    description: "Track every delivery stage",
  },
  {
    img: "/images/icons/icon-03.svg",
    title: "100% Secure Payments",
    description: "Stripe-secured payments",
  },
  {
    img: "/images/icons/icon-04.svg",
    title: "24/7 Dedicated Support",
    description: "Anywhere & anytime",
  },
];

const HeroFeature = () => {
  return (
    <div className="mx-auto w-full max-w-[1060px] px-4 sm:px-8 xl:px-0">
      <div className="mt-8 grid grid-cols-2 items-stretch gap-x-3 gap-y-5 sm:mt-10 sm:gap-x-5 sm:gap-y-6 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-0 xl:gap-x-7.5 2xl:gap-x-12.5">
        {featureData.map((item) => (
          <div
            className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left lg:gap-2 xl:gap-3"
            key={item.title}
          >
            <Image
              src={item.img}
              alt=""
              width={40}
              height={41}
              className="h-8 w-8 shrink-0 sm:h-9 sm:w-9 lg:h-8 lg:w-8 xl:h-9 xl:w-9 2xl:h-10 2xl:w-10"
            />

            <div className="min-w-0">
              <h3 className="break-words text-xs font-medium leading-4 text-dark sm:text-sm sm:leading-5 lg:text-[12px] lg:leading-4 xl:text-sm xl:leading-5 2xl:text-base 2xl:leading-6">
                {item.title}
              </h3>
              <p className="mt-0.5 break-words text-[10px] leading-4 sm:text-xs lg:text-[10px] lg:leading-4 xl:text-xs 2xl:text-sm">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroFeature;
