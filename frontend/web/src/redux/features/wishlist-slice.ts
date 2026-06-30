import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type WishListItem = {
  id: number;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  stock: number;
  image?: string;
  status?: string;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
};

type InitialState = {
  items: WishListItem[];
  hydrated: boolean;
};

const initialState: InitialState = {
  items: [],
  hydrated: false,
};

export const wishlist = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    hydrateWishlist: (state, action: PayloadAction<WishListItem[]>) => {
      state.items = action.payload.filter((item) => item.id > 0);
      state.hydrated = true;
    },
    addItemToWishlist: (state, action: PayloadAction<WishListItem>) => {
      const existingItem = state.items.find((item) => item.id === action.payload.id);
      if (existingItem) {
        Object.assign(existingItem, action.payload, { quantity: 1 });
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeItemFromWishlist: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    removeAllItemsFromWishlist: (state) => {
      state.items = [];
    },
  },
});

export const selectWishlistItems = (state: RootState) => state.wishlistReducer.items;
export const selectWishlistCount = (state: RootState) => state.wishlistReducer.items.length;

export const {
  hydrateWishlist,
  addItemToWishlist,
  removeItemFromWishlist,
  removeAllItemsFromWishlist,
} = wishlist.actions;
export default wishlist.reducer;
