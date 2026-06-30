import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3000').replace(/\/$/, '');

const StorefrontRedirect = ({ destination, productQuery = false, orderQuery = false }) => {
  const params = useParams();

  useEffect(() => {
    const target = new URL(`${STOREFRONT_URL}${destination}`);
    if (productQuery && params.id) target.searchParams.set('id', params.id);
    if (orderQuery && params.orderId) target.searchParams.set('orderId', params.orderId);
    window.location.replace(target.toString());
  }, [destination, orderQuery, params.id, params.orderId, productQuery]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Opening AliBazaar</h1>
        <p className="mt-2 text-gray-600">Redirecting to the customer storefront…</p>
      </div>
    </main>
  );
};

export default StorefrontRedirect;
