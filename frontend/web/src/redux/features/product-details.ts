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

export const productDetails = createSlice({
  name: "productDetails",
  initialState: { value: emptyProduct },
  reducers: {
    updateproductDetails: (state, action: PayloadAction<Product>) => {
      state.value = action.payload;
    },
  },
});

export const { updateproductDetails } = productDetails.actions;
export default productDetails.reducer;
