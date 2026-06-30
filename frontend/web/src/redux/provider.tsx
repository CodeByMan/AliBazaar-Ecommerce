'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { hydrateCart, reconcileCart, type CartItem } from './features/cart-slice';
import { hydrateWishlist, type WishListItem } from './features/wishlist-slice';
import { getProducts } from '@/lib/api/products';
import { ApiRequestError, getCustomerSession, type CustomerProfile } from '@/lib/api/auth';
import {
  addServerCartItem,
  getServerCart,
  getServerWishlist,
  mapServerCart,
  removeServerCartItem,
  toggleServerWishlist,
  updateServerCartItem,
} from '@/lib/api/customer-state';
import { setAuthenticated, setGuest } from './features/auth-slice';
import { store } from './store';

const CART_STORAGE_KEY = 'alibazaar-cart-v1';
const WISHLIST_STORAGE_KEY = 'alibazaar-wishlist-v1';

const cartSignature = (items: CartItem[]) =>
  items
    .map((item) => `${item.id}:${item.quantity}`)
    .sort()
    .join('|');

const wishSignature = (items: WishListItem[]) =>
  items
    .map((item) => item.id)
    .sort((a, b) => a - b)
    .join('|');

const readStoredItems = <T,>(key: string): T[] => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
};

const StorePersistence = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    let disposed = false;
    let serverReady = false;
    let activeAccountId: number | null = null;
    let initializingAccountId: number | null = null;
    let syncTimer: ReturnType<typeof setTimeout> | undefined;
    let sessionRetryTimer: ReturnType<typeof setTimeout> | undefined;
    let sessionRequestInFlight = false;
    let guestStateInitialized = false;
    let lastCart = '';
    let lastWish = '';

    const localCart = readStoredItems<CartItem>(CART_STORAGE_KEY);
    const localWish = readStoredItems<WishListItem>(WISHLIST_STORAGE_KEY);

    store.dispatch(hydrateCart(localCart));
    store.dispatch(hydrateWishlist(localWish));

    const reconcileGuestCart = () => {
      if (!localCart.length) return;
      void getProducts()
        .then(({ products }) => {
          if (disposed) return;
          store.dispatch(
            reconcileCart(
              products.map((product) => ({
                id: product.id,
                title: product.title,
                price: product.price,
                discountedPrice: product.discountedPrice,
                stock: product.stock,
                image: product.image,
                imgs: product.imgs,
              })),
            ),
          );
        })
        .catch(() => undefined);
    };

    const initializeCustomerState = async (user: CustomerProfile) => {
      if (
        disposed ||
        (serverReady && activeAccountId === user.id) ||
        initializingAccountId === user.id
      ) {
        return;
      }

      serverReady = false;
      initializingAccountId = user.id;

      try {
        const [serverCart, serverWishlist] = await Promise.all([
          getServerCart(),
          getServerWishlist(),
        ]);
        if (disposed) return;

        const currentCart = store.getState().cartReducer.items;
        const currentWishlist = store.getState().wishlistReducer.items;

        if (serverCart.items.length > 0) {
          store.dispatch(hydrateCart(mapServerCart(serverCart.items)));
        } else {
          for (const item of currentCart) {
            await addServerCartItem(item.id, item.quantity);
          }
        }

        if (serverWishlist.length > 0) {
          store.dispatch(hydrateWishlist(serverWishlist));
        } else {
          for (const item of currentWishlist) {
            await toggleServerWishlist(item.id);
          }
        }

        if (disposed) return;
        activeAccountId = user.id;
        lastCart = cartSignature(store.getState().cartReducer.items);
        lastWish = wishSignature(store.getState().wishlistReducer.items);
        serverReady = true;
      } catch {
        // Keep the local state usable if synchronization is temporarily unavailable.
        serverReady = false;
      } finally {
        if (initializingAccountId === user.id) initializingAccountId = null;
      }
    };

    const initializeGuestState = () => {
      if (guestStateInitialized) return;
      guestStateInitialized = true;
      store.dispatch(setGuest());
      reconcileGuestCart();
    };

    const scheduleSessionRetry = () => {
      if (sessionRetryTimer) clearTimeout(sessionRetryTimer);
      sessionRetryTimer = setTimeout(() => {
        sessionRetryTimer = undefined;
        void initializeSession();
      }, 5000);
    };

    const initializeSession = async () => {
      if (disposed || sessionRequestInFlight) return;
      sessionRequestInFlight = true;

      try {
        const session = await getCustomerSession();
        if (disposed) return;

        if (sessionRetryTimer) {
          clearTimeout(sessionRetryTimer);
          sessionRetryTimer = undefined;
        }

        if (session.role !== 'user' || !session.user) {
          initializeGuestState();
          return;
        }

        guestStateInitialized = false;
        store.dispatch(setAuthenticated(session.user));
        await initializeCustomerState(session.user);
      } catch (error) {
        if (disposed) return;

        initializeGuestState();
        if (error instanceof ApiRequestError && error.status === 0) {
          scheduleSessionRetry();
        }
      } finally {
        sessionRequestInFlight = false;
      }
    };

    const syncServer = async () => {
      const state = store.getState();
      if (
        !serverReady ||
        state.authReducer.status !== 'authenticated' ||
        !state.authReducer.user ||
        activeAccountId !== state.authReducer.user.id
      ) {
        return;
      }

      const desiredCart = state.cartReducer.items;
      const desiredWishlist = state.wishlistReducer.items;
      const nextCartSignature = cartSignature(desiredCart);
      const nextWishSignature = wishSignature(desiredWishlist);

      try {
        if (nextCartSignature !== lastCart) {
          const server = await getServerCart();
          const serverByProduct = new Map(
            server.items.map((row) => [row.product.id, row]),
          );

          for (const item of desiredCart) {
            const row = serverByProduct.get(item.id);
            if (!row) await addServerCartItem(item.id, item.quantity);
            else if (row.quantity !== item.quantity) {
              await updateServerCartItem(row.id, item.quantity);
            }
            serverByProduct.delete(item.id);
          }

          for (const row of Array.from(serverByProduct.values())) {
            await removeServerCartItem(row.id);
          }
          lastCart = nextCartSignature;
        }

        if (nextWishSignature !== lastWish) {
          const serverWishlist = await getServerWishlist();
          const serverIds = new Set(serverWishlist.map((item) => item.id));
          const desiredIds = new Set(desiredWishlist.map((item) => item.id));

          for (const id of Array.from(desiredIds)) {
            if (!serverIds.has(id)) await toggleServerWishlist(id);
          }
          for (const id of Array.from(serverIds)) {
            if (!desiredIds.has(id)) await toggleServerWishlist(id);
          }
          lastWish = nextWishSignature;
        }
      } catch {
        // Local cart and wishlist remain usable during temporary API failures.
      }
    };

    void initializeSession();
    const retrySession = () => void initializeSession();
    window.addEventListener('online', retrySession);

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();

      if (state.cartReducer.hydrated) {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(state.cartReducer.items),
        );
      }
      if (state.wishlistReducer.hydrated) {
        localStorage.setItem(
          WISHLIST_STORAGE_KEY,
          JSON.stringify(state.wishlistReducer.items),
        );
      }

      if (state.authReducer.status === 'guest') {
        serverReady = false;
        activeAccountId = null;
        initializingAccountId = null;
      } else if (
        state.authReducer.status === 'authenticated' &&
        state.authReducer.user &&
        activeAccountId !== state.authReducer.user.id
      ) {
        void initializeCustomerState(state.authReducer.user);
      }

      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => void syncServer(), 500);
    });

    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener('online', retrySession);
      if (syncTimer) clearTimeout(syncTimer);
      if (sessionRetryTimer) clearTimeout(sessionRetryTimer);
    };
  }, []);

  return <>{children}</>;
};

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StorePersistence>{children}</StorePersistence>
    </Provider>
  );
}
