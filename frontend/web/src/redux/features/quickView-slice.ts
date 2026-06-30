import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types/product";

const emptyProduct: Product = {
  id: 0,
  title: "",
  description: "",
  category: "",
  stock: 0,
  reviews: 0,
  rating: 0,
  price: 0,
  discountedPrice: 0,
  image: "/images/placeholder-product.svg",
  imgs: { thumbnails: [], previews: [] },
  reviewItems: [],
};

export const quickView = createSlice({
  name: "quickView",
  initialState: { value: emptyProduct },
  reducers: {
    updateQuickView: (state, action: PayloadAction<Product>) => {
      state.value = action.payload;
    },
    resetQuickView: (state) => {
      state.value = emptyProduct;
    },
  },
});

export const { updateQuickView, resetQuickView } = quickView.actions;
export default quickView.reducer;
