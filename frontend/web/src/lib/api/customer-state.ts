import { API_BASE_URL, getProductImageUrl } from './products';
import { ApiRequestError } from './auth';
import type { CartItem } from '@/redux/features/cart-slice';
import type { WishListItem } from '@/redux/features/wishlist-slice';

export type ServerCartRow = {
  id: number;
  quantity: number;
  total: number;
  product: {
    id: number;
    name: string;
    price: number | string;
    discountEnabled?: boolean;
    discountPercentage?: number | string;
    stock: number | string;
    image: string;
  };
};

type ServerCartResponse = { items: ServerCartRow[]; subtotal: number };
type ServerProduct = { id: number; name: string; price: number | string; discountEnabled?: boolean; discountPercentage?: number | string; stock: number | string; image: string };

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include', cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try { const body = await response.json(); message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message || message; } catch {}
    throw new ApiRequestError(message, response.status);
  }
  return response.json() as Promise<T>;
};

const mapProduct = (product: ServerProduct, quantity = 1): CartItem => {
  const price = Number(product.price) || 0;
  const percentage = product.discountEnabled
    ? Math.min(100, Math.max(0, Number(product.discountPercentage) || 0))
    : 0;
  const discountedPrice = percentage > 0
    ? Math.round((price * (1 - percentage / 100) + Number.EPSILON) * 100) / 100
    : price;
  const image = getProductImageUrl(product.image);
  return { id: product.id, title: product.name, price, discountedPrice, stock: Number(product.stock) || 0, quantity, image, imgs: { thumbnails:[image], previews:[image] } };
};

export const getServerCart = () => request<ServerCartResponse>('/cart');
export const addServerCartItem = (productId: number, quantity: number) => request<ServerCartRow>('/cart/add', { method:'POST', body:JSON.stringify({ productId, quantity }) });
export const updateServerCartItem = (cartId: number, quantity: number) => request<ServerCartRow>(`/cart/update/${cartId}`, { method:'PUT', body:JSON.stringify({ quantity }) });
export const removeServerCartItem = (cartId: number) => request(`/cart/remove/${cartId}`, { method:'DELETE' });
export const clearServerCart = () => request('/cart/clear', { method:'DELETE' });
export const mapServerCart = (rows: ServerCartRow[]): CartItem[] => rows.map((row) => mapProduct(row.product, row.quantity));

export const getServerWishlist = async (): Promise<WishListItem[]> => {
  const products = await request<ServerProduct[]>('/wishlist');
  return products.map((product) => ({ ...mapProduct(product, 1), quantity:1 }));
};
export const toggleServerWishlist = (productId: number) => request<{ liked:boolean }>('/wishlist/toggle', { method:'POST', body:JSON.stringify({ productId }) });
