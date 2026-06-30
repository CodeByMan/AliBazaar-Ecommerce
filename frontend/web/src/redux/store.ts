import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";

import quickViewReducer from "./features/quickView-slice";
import cartReducer, { addItemToCart } from "./features/cart-slice";
import wishlistReducer, { addItemToWishlist } from "./features/wishlist-slice";
import productDetailsReducer from "./features/product-details";
import authReducer from './features/auth-slice';
import notificationReducer, {
  showNotification,
} from "./features/notification-slice";

import { TypedUseSelectorHook, useSelector } from "react-redux";

const notificationListener = createListenerMiddleware();

notificationListener.startListening({
  actionCreator: addItemToCart,
  effect: (action, listenerApi) => {
    if (action.payload.stock > 0) {
      listenerApi.dispatch(showNotification("Successfully added to cart."));
    }
  },
});

notificationListener.startListening({
  actionCreator: addItemToWishlist,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(showNotification("Successfully added to wishlist."));
  },
});

export const store = configureStore({
  reducer: {
    quickViewReducer,
    cartReducer,
    wishlistReducer,
    productDetailsReducer,
    notificationReducer,
    authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(notificationListener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
