"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { usePreviewSlider } from "@/app/context/PreviewSliderContext";
import { useAppSelector } from "@/redux/store";

const PreviewSliderModal = () => {
  const { closePreviewModal, isModalPreviewOpen } = usePreviewSlider();
  const product = useAppSelector((state) => state.productDetailsReducer.value);
  const images = product.imgs.previews.length ? product.imgs.previews : [product.image];

  if (!isModalPreviewOpen) return null;

  return (
    <div className="preview-slider fixed w-full h-screen z-999999 inset-0 flex justify-center items-center bg-[#000000F2] px-4">
      <button type="button" onClick={closePreviewModal} aria-label="Close image preview" className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center justify-center w-10 h-10 rounded-full text-white hover:text-meta-5 z-10 text-4xl">×</button>
      <Swiper slidesPerView={1} spaceBetween={20} className="w-full max-w-[900px]">
        {images.filter(Boolean).map((image, index) => (
          <SwiperSlide key={`${image}-${index}`}>
            <div className="flex justify-center items-center min-h-[70vh]">
              <Image src={image} alt={`${product.title} image ${index + 1}`} width={650} height={650} className="max-h-[75vh] w-auto object-contain" style={{ width: "auto", height: "auto" }} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PreviewSliderModal;
