import Image from "next/image";
import Link from "next/link";
import { Category } from "@/types/category";

const SingleItem = ({ item }: { item: Category }) => (
  <Link href={item.href} className="group flex flex-col items-center">
    <div className="max-w-[130px] w-full bg-[#F2F3F8] h-32.5 rounded-full flex items-center justify-center mb-4">
      <Image src={item.img} alt={item.title} width={82} height={82} className="h-[82px] w-[82px] rounded-full object-cover" />
    </div>
    <div className="flex justify-center">
      <h3 className="inline-block font-medium text-center text-dark bg-gradient-to-r from-blue to-blue bg-[length:0px_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px] group-hover:text-blue">
        {item.title} <span className="text-custom-xs text-dark-4">({item.products})</span>
      </h3>
    </div>
  </Link>
);

export default SingleItem;
