import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/admin-home', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { label: 'Products', path: '/admin-products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Categories', path: '/admin-categories', icon: 'M4 6h16M4 12h16M4 18h7' },
  { label: 'Orders', path: '/admin-orders', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l3.414 3.414A1 1 0 0117 7.414V19a2 2 0 01-2 2z' },
  { label: 'Users', path: '/admin-users', icon: 'M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m4-5.13a4 4 0 11-8 0 4 4 0 018 0zm8 0a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: 'Roles', path: '/admin-roles', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { label: 'Coupons', path: '/admin-coupons', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M5 4h14a1 1 0 011 1v4a3 3 0 000 6v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4a3 3 0 000-6V5a1 1 0 011-1z' },
  { label: 'Reviews', path: '/admin-reviews', icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.876 9.876 0 01-4-.8L3 20l1.3-3.9A7.414 7.414 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
];

const Icon = ({ path, className = 'h-5 w-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
  </svg>
);

export default function AdminPageShell({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('adminSidebarCollapsed') === 'true',
  );
  const dropdownRef = useRef(null);
  const username = localStorage.getItem('username') || 'Admin';

  useEffect(() => {
    const closeDropdown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', closeDropdown);
    return () => document.removeEventListener('mousedown', closeDropdown);
  }, []);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', sidebarCollapsed ? 'true' : 'false');
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileSidebarOpen]);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const sidebarWidth = sidebarCollapsed ? 'lg:w-20' : 'lg:w-72';
  const contentOffset = sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72';

  const sidebarContent = (
    <>
      <div className={`shrink-0 border-b border-gray-100 py-4 sm:py-5 ${sidebarCollapsed ? 'px-4 lg:px-3' : 'px-5 lg:px-6'}`}>
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-between lg:justify-center' : 'justify-between gap-3'}`}>
          <div className={`min-w-0 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
            <p className="truncate text-xl font-bold text-gray-900"><span className="text-blue-600">Ali</span>Bazaar</p>
            <p className="mt-1 truncate text-xs text-gray-500">Admin navigation</p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 lg:flex"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Shrink sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Shrink sidebar'}
          >
            <Icon path={sidebarCollapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7M19 19l-7-7 7-7'} className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className={`min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain py-4 sm:py-5 ${sidebarCollapsed ? 'px-4 lg:px-3' : 'px-4'}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={sidebarCollapsed ? item.label : undefined}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center rounded-xl py-3 text-sm font-semibold transition ${sidebarCollapsed ? 'gap-3 px-4 lg:justify-center lg:px-3' : 'gap-3 px-4'} ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`
            }
          >
            <span className="shrink-0"><Icon path={item.icon} /></span>
            <span className={`min-w-0 truncate ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={`shrink-0 border-t border-gray-100 p-4 text-xs leading-5 text-gray-500 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
        Developed by Muhammad Ali Nawaz © 2026
      </div>
    </>
  );

  return (
    <div className="min-h-screen min-h-dvh w-full min-w-0 overflow-x-clip bg-gradient-to-br from-gray-50 via-white to-blue-50/30 text-gray-900">
      <aside className={`fixed left-0 top-0 z-40 hidden h-screen h-dvh border-r border-gray-200 bg-white/95 shadow-xl backdrop-blur transition-[width] duration-300 lg:flex lg:flex-col ${sidebarWidth}`}>
        {sidebarContent}
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="absolute inset-0 h-full w-full rounded-none bg-gray-900/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-screen h-dvh w-[min(88vw,20rem)] min-w-0 flex-col border-r border-gray-200 bg-white shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className={`min-w-0 transition-[padding] duration-300 ${contentOffset}`}>
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex min-h-16 min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 lg:hidden"
                aria-label="Open sidebar"
                aria-expanded={mobileSidebarOpen}
              >
                <Icon path="M4 6h16M4 12h16M4 18h16" className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-bold text-gray-900 min-[360px]:text-base sm:text-xl">Admin Dashboard - Ali Bazaar</h1>
                <p className="hidden truncate text-xs text-gray-500 min-[360px]:block">Manage your store from one place</p>
              </div>
            </div>

            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-bold text-white shadow-md transition hover:from-blue-700 hover:to-purple-700 sm:h-11 sm:w-11 sm:text-base"
                aria-label="Open admin profile menu"
                aria-expanded={profileOpen}
              >
                {username.charAt(0).toUpperCase()}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-[min(14rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-gray-900">{username}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="w-full min-w-0 max-w-full px-3 py-5 sm:px-5 sm:py-7 md:px-6 lg:px-8 lg:py-8">
          <div className="mb-5 flex min-w-0 flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
              {subtitle && <p className="mt-2 max-w-4xl break-words text-sm leading-6 text-gray-600 sm:text-base">{subtitle}</p>}
            </div>
            {actions && (
              <div className="admin-page-actions flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto sm:shrink-0 sm:justify-end sm:pt-1">
                {actions}
              </div>
            )}
          </div>
          <div className="min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}

export const Field = ({ label, children, className = '' }) => (
  <label className={`block min-w-0 text-sm font-medium text-gray-700 ${className}`}>
    <span className="mb-2 block break-words">{label}</span>
    {children}
  </label>
);

export const inputClass = 'block w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
export const primaryButton = 'mobile-full-button inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-center font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto';
export const secondaryButton = 'mobile-full-button inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-center font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto';
