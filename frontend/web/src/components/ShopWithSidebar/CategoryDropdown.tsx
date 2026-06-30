"use client";

import { useState } from "react";
import { ProductCategory } from "@/types/product";

const CategoryDropdown = ({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white shadow-1 rounded-lg">
      <button type="button" onClick={() => setOpen((value) => !value)} className={`w-full cursor-pointer flex items-center justify-between py-3 pl-6 pr-5.5 ${open ? "shadow-filter" : ""}`}>
        <span className="text-dark">Category</span>
        <svg className={`fill-current ease-out duration-200 ${open ? "rotate-180" : ""}`} width="24" height="24" viewBox="0 0 24 24"><path d="M5 9l7 6 7-6" /></svg>
      </button>
      <div className={`flex-col gap-3 py-6 pl-6 pr-5.5 ${open ? "flex" : "hidden"}`}>
        <button type="button" onClick={() => onSelect("")} className={`${selectedCategory === "" ? "text-blue" : ""} group flex items-center justify-between hover:text-blue`}>
          <span>All Categories</span>
          <span className={`${selectedCategory === "" ? "text-white bg-blue" : "bg-gray-2"} inline-flex rounded-[30px] text-custom-xs px-2`}>{categories.reduce((total, item) => total + item.products, 0)}</span>
        </button>
        {categories.map((category) => (
          <button type="button" key={category.name} onClick={() => onSelect(category.name)} className={`${selectedCategory === category.name ? "text-blue" : ""} group flex items-center justify-between hover:text-blue`}>
            <span>{category.name}</span>
            <span className={`${selectedCategory === category.name ? "text-white bg-blue" : "bg-gray-2"} inline-flex rounded-[30px] text-custom-xs px-2`}>{category.products}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryDropdown;
