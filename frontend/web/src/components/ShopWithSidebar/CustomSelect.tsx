"use client";

import { useEffect, useRef, useState } from "react";

type Option = { label: string; value: string };

const CustomSelect = ({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="custom-select custom-select-2 flex-shrink-0 relative" ref={selectRef}>
      <button type="button" className={`select-selected whitespace-nowrap ${isOpen ? "select-arrow-active" : ""}`} onClick={() => setIsOpen((open) => !open)}>
        {selectedOption.label}
      </button>
      <div className={`select-items ${isOpen ? "" : "select-hide"}`}>
        {options.map((option) => (
          <button type="button" key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`select-item w-full text-left ${selectedOption.value === option.value ? "same-as-selected" : ""}`}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomSelect;
