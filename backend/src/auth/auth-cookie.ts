import type { CookieOptions, Response } from 'express';

export const getAuthCookieName = () =>
  process.env.AUTH_COOKIE_NAME?.trim() || 'alibazaar_session';

const cookieOptions = (): CookieOptions => {
  const maxAge = Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 86_400_000);
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Number.isFinite(maxAge) && maxAge > 0 ? maxAge : 86_400_000,
  };
};

export const setAuthCookie = (response: Response, token: string) => {
  response.cookie(getAuthCookieName(), token, cookieOptions());
};

export const clearAuthCookie = (response: Response) => {
  const options = cookieOptions();
  response.clearCookie(getAuthCookieName(), {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
};
