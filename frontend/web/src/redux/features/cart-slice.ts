import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export type CartItem = {
  id: number;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  stock: number;
  image?: string;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
};

type InitialState = {
  items: CartItem[];
  hydrated: boolean;
};

const initialState: InitialState = {
  items: [],
  hydrated: false,
};

const normalizeQuantity = (quantity: number, stock: number) => {
  const safeStock = Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  return Math.max(1, Math.min(Math.max(1, safeQuantity), Math.max(1, safeStock)));
};

export type CartCatalogItem = Omit<CartItem, 'quantity'>;

export const cart = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
        .filter((item) => item.id > 0 && item.stock > 0)
        .map((item) => ({
          ...item,
          quantity: normalizeQuantity(item.quantity, item.stock),
        }));
      state.hydrated = true;
    },
    addItemToCart: (state, action: PayloadAction<CartItem>) => {
      const item = action.payload;
      if (item.stock <= 0) return;
      const existingItem = state.items.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        existingItem.stock = item.stock;
        existingItem.price = item.price;
        existingItem.discountedPrice = item.discountedPrice;
        existingItem.quantity = normalizeQuantity(
          existingItem.quantity + item.quantity,
          item.stock,
        );
      } else {
        state.items.push({
          ...item,
          quantity: normalizeQuantity(item.quantity, item.stock),
        });
      }
    },
    removeItemFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateCartItemQuantity: (
      state,
      action: PayloadAction<{ id: number; quantity: number }>,
    ) => {
      const existingItem = state.items.find((item) => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity = normalizeQuantity(action.payload.quantity, existingItem.stock);
      }
    },
    reconcileCart: (state, action: PayloadAction<CartCatalogItem[]>) => {
      const catalog = new Map(action.payload.map((item) => [item.id, item]));
      state.items = state.items.flatMap((item) => {
        const current = catalog.get(item.id);
        if (!current || current.stock <= 0) return [];
        return [
          {
            ...item,
            ...current,
            quantity: normalizeQuantity(item.quantity, current.stock),
          },
        ];
      });
    },
    removeAllItemsFromCart: (state) => {
      state.items = [];
    },
  },
});

export const selectCartItems = (state: RootState) => state.cartReducer.items;
export const selectCartHydrated = (state: RootState) => state.cartReducer.hydrated;
export const selectTotalPrice = createSelector([selectCartItems], (items) =>
  items.reduce((total, item) => total + item.discountedPrice * item.quantity, 0),
);
export const selectCartCount = createSelector([selectCartItems], (items) =>
  items.reduce((total, item) => total + item.quantity, 0),
);

export const {
  hydrateCart,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  reconcileCart,
  removeAllItemsFromCart,
} = cart.actions;
export default cart.reducer;
