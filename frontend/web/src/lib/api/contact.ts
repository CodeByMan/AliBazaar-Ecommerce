import { ApiRequestError } from './auth';
import { API_BASE_URL } from './products';

export type ContactMessagePayload = {
  firstName: string;
  lastName: string;
  subject: string;
  phone?: string;
  message: string;
};

export const sendContactMessage = async (payload: ContactMessagePayload) => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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

  return response.json() as Promise<{ message: string }>;
};
