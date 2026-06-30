import { API_BASE_URL } from './products';

export type CustomerProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  username: string;
  profileImage?: string | null;
};

export type AuthResponse = {
  message: string;
  token?: string;
  role: string;
  username: string;
  id?: number;
  user: CustomerProfile | null;
};

export type AuthSessionResponse = {
  authenticated: true;
  role: string;
  username: string;
  user: CustomerProfile | null;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store',
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
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new ApiRequestError(message, response.status);
  }

  return response.json() as Promise<T>;
};

export const signInCustomer = (payload: {
  username: string;
  password: string;
}) =>
  request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const checkUsernameAvailability = (username: string) =>
  request<{ username: string; available: boolean }>(
    `/user/check-username?username=${encodeURIComponent(username.trim())}`,
  );

export const signUpCustomer = (payload: {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  age: number;
}) =>
  request<AuthResponse>('/user/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCustomerSession = (signal?: AbortSignal) =>
  request<AuthSessionResponse>('/auth/session', { signal });

export const signOutCustomer = () =>
  request<{ message: string }>('/auth/logout', { method: 'POST' });

export const updateCustomerProfile = (payload: Partial<{
  username: string;
  name: string;
  email: string;
  phone: string;
  age: number;
}>) =>
  request<CustomerProfile>('/user/update/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const changeCustomerPassword = (payload: {
  currentPassword: string;
  newPassword: string;
}) =>
  request<{ message: string }>('/user/change-password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });


export const updateCustomerProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append('profileImage', file);
  const response = await fetch(`${API_BASE_URL}/user/profile-image`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    body: formData,
    cache: 'no-store',
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.message === 'string') message = body.message;
      if (Array.isArray(body?.message)) message = body.message.join(' ');
    } catch {}
    throw new ApiRequestError(message, response.status);
  }
  return response.json() as Promise<CustomerProfile>;
};
