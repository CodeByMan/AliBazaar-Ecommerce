import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageShell from './AdminPageShell';

const icons = {
  products: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  orders: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l3.414 3.414A1 1 0 0117 7.414V19a2 2 0 01-2 2z',
  users: 'M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m4-5.13a4 4 0 11-8 0 4 4 0 018 0zm8 0a4 4 0 11-8 0 4 4 0 018 0z',
  categories: 'M4 6h16M4 12h16M4 18h7',
  roles: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  coupons: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M5 4h14a1 1 0 011 1v4a3 3 0 000 6v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4a3 3 0 000-6V5a1 1 0 011-1z',
  reviews: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.876 9.876 0 01-4-.8L3 20l1.3-3.9A7.414 7.414 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
};

export default function AdminHome() {
  const navigate = useNavigate();
  const features = [
    ['Products', '/admin-products', 'products', 'bg-blue-50', 'text-blue-600'],
    ['Categories', '/admin-categories', 'categories', 'bg-cyan-50', 'text-cyan-600'],
    ['Orders', '/admin-orders', 'orders', 'bg-purple-50', 'text-purple-600'],
    ['Users', '/admin-users', 'users', 'bg-green-50', 'text-green-600'],
    ['Roles', '/admin-roles', 'roles', 'bg-indigo-50', 'text-indigo-600'],
    ['Coupons', '/admin-coupons', 'coupons', 'bg-amber-50', 'text-amber-600'],
    ['Reviews', '/admin-reviews', 'reviews', 'bg-pink-50', 'text-pink-600'],
  ];

  return (
    <AdminPageShell>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {features.map(([title, path, icon, bg, text]) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="group min-w-0 rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-lg transition hover:-translate-y-1 hover:shadow-xl sm:p-6"
          >
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${bg}`}>
              <svg className={`h-8 w-8 ${text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icons[icon]} />
              </svg>
            </div>
            <h3 className="break-words text-lg font-semibold text-gray-900">Manage {title}</h3>
            <p className="mt-1 text-sm text-gray-500">Open management area</p>
          </button>
        ))}
      </div>
    </AdminPageShell>
  );
}
