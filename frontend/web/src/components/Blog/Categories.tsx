import React from "react";

type BlogCategory = {
  name: string;
  products: number;
};

const Categories = ({ categories }: { categories: BlogCategory[] }) => {
  return (
    <div className="shadow-1 bg-white rounded-xl mt-7.5">
      <div className="px-4 sm:px-6 py-4.5 border-b border-gray-3">
        <h2 className="font-medium text-lg text-dark">Popular Category</h2>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-3">
          {categories.map((category) => (
            <div
              key={category.name}
              className="group flex items-center justify-between text-dark"
            >
              <span>{category.name}</span>
              <span className="inline-flex rounded-[30px] bg-gray-2 text-custom-xs px-1.5">
                {category.products}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
