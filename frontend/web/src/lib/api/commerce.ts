import { API_BASE_URL, getProductImageUrl } from './products';
import { ApiRequestError } from './auth';

export type OrderStatus = 'Pending' | 'Dispatched' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Refunded';

export type OrderHistoryEntry = {
  id: number;
  oldStatus: OrderStatus | null;
  newStatus: OrderStatus;
  reason: string | null;
  createdAt: string;
};

export type CustomerOrderItem = {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  canReview: boolean;
};

export type CustomerOrder = {
  id: number;
  orderNumber: string;
  customer: { fullName: string; email: string; phone: string };
  delivery: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    notes?: string | null;
    estimatedDeliveryAt: string | null;
    dispatchedAt: string | null;
    deliveredAt: string | null;
  };
  status: OrderStatus;
  availableTransitions: OrderStatus[];
  cancellationReason: string | null;
  cancelledAt: string | null;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode: string | null;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: OrderHistoryEntry[];
  items: CustomerOrderItem[];
  payment: {
    provider: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paymentReference?: string;
    paymentMethodType: string | null;
    cardLastFour: string | null;
    cardBrand: string | null;
    isTest: boolean;
    paidAt: string | null;
  } | null;
};

export type CustomerCoupon = {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumOrderAmount: number;
  maximumDiscount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  usedAt: string | null;
  reason: string | null;
  sourceOrderNumber: string | null;
};

export type CouponValidation = {
  valid: true;
  code: string;
  discount: number;
  totalAfterDiscount: number;
  type: 'percentage' | 'fixed';
  kind: 'discount' | 'compensation';
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.message === 'string') message = body.message;
      if (Array.isArray(body?.message)) message = body.message.join(' ');
    } catch {
      // Keep fallback.
    }
    throw new ApiRequestError(message, response.status);
  }

  return response.json() as Promise<T>;
};

export const getMyOrders = (signal?: AbortSignal) =>
  request<CustomerOrder[]>('/orders', { signal });

export const getMyOrder = (orderNumber: string, signal?: AbortSignal) =>
  request<CustomerOrder>(`/orders/mine/${encodeURIComponent(orderNumber)}`, { signal });

export const getMyCoupons = (signal?: AbortSignal) =>
  request<CustomerCoupon[]>('/coupons/my', { signal });

export const validateCoupon = (code: string, subtotal: number) =>
  request<CouponValidation>('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim().toUpperCase(), subtotal }),
  });

export const createReview = async (payload: {
  orderItemId: number;
  rating: number;
  text: string;
  feedback?: string;
  image?: File | null;
}) => {
  const form = new FormData();
  form.append('orderItemId', String(payload.orderItemId));
  form.append('rating', String(payload.rating));
  form.append('text', payload.text);
  if (payload.feedback?.trim()) form.append('feedback', payload.feedback.trim());
  if (payload.image) form.append('image', payload.image);
  return request('/reviews', { method: 'POST', body: form });
};

export const orderItemImage = (value?: string | null) => getProductImageUrl(value);
