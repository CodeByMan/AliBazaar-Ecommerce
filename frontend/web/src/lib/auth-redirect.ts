export const getSafeRedirect = (
  requested: string | null | undefined,
  fallback: string,
) => {
  if (!requested || !requested.startsWith('/') || requested.startsWith('//')) {
    return fallback;
  }

  const path = requested.split('?')[0];
  if (path === '/signin' || path === '/signup') return fallback;
  return requested;
};

export const withRedirect = (path: '/signin' | '/signup', redirect: string) =>
  `${path}?redirect=${encodeURIComponent(redirect)}`;
