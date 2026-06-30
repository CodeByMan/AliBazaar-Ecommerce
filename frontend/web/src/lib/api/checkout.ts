import { API_BASE_URL } from './products';
import { ApiRequestError } from './auth';
import type { CustomerOrder } from './commerce';

export type CheckoutCustomer = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  notes?: string;
};

export type CheckoutItemRequest = { productId: number; quantity: number };
export type CheckoutBreakdown = { subtotal: number; deliveryCharge: number; discount: number; total: number; currency: string };

export type CheckoutConfig = {
  currency: string;
  country: string;
  paymentProvider: 'mock' | 'stripe';
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  reservationMinutes: number;
  mockPayment: {
    successCard: string;
    declineCard: string;
    expiry: string;
    cvc: string;
  } | null;
};

export type PaymentIntentResponse = {
  alreadyCompleted: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  expiresAt?: string;
  breakdown?: CheckoutBreakdown;
  order?: CustomerOrder;
};

export type MockCardPayload = {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  cardholderName: string;
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
      cache: 'no-store',
      credentials: 'include',
    });
  } catch {
    throw new ApiRequestError(
      'Cannot connect to the AliBazaar API. Start the NestJS backend on port 5000 and try again.',
      0,
    );
  }
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.message === 'string') message = body.message;
      if (Array.isArray(body?.message)) message = body.message.join(' ');
    } catch {}
    throw new ApiRequestError(message, response.status);
  }
  return response.json() as Promise<T>;
};

export const getCheckoutConfig = (signal?: AbortSignal) => request<CheckoutConfig>('/checkout/config', { signal });

export const createPaymentIntent = (payload: {
  checkoutReference: string;
  customer: CheckoutCustomer;
  items: CheckoutItemRequest[];
  couponCode?: string;
}) => request<PaymentIntentResponse>('/checkout/payment-intent', { method: 'POST', body: JSON.stringify(payload) });

export const completeMockCheckout = (payload: {
  checkoutReference: string;
  customer: CheckoutCustomer;
  items: CheckoutItemRequest[];
  couponCode?: string;
  card: MockCardPayload;
}) => request<CustomerOrder>('/checkout/mock', { method: 'POST', body: JSON.stringify(payload) });

export const confirmPaymentOrder = (paymentIntentId: string) =>
  request<CustomerOrder>('/checkout/confirm', { method: 'POST', body: JSON.stringify({ paymentIntentId }) });

export const trackOrder = (orderNumber: string, signal?: AbortSignal) =>
  request<CustomerOrder>(`/orders/track/${encodeURIComponent(orderNumber.trim())}`, { signal });
