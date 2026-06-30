"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { hideNotification } from "@/redux/features/notification-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";

const ToastNotification = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notification = useAppSelector((state) => state.notificationReducer);

  useEffect(() => {
    if (!notification.visible) return;

    const timeout = window.setTimeout(() => {
      dispatch(hideNotification());
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [dispatch, notification.id, notification.visible]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-none fixed left-1/2 top-4 z-999999 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 transition-all duration-200 sm:left-auto sm:right-5 sm:top-5 sm:translate-x-0 ${
        notification.visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-3 opacity-0"
      }`}
    >
      <div className="flex min-h-12 items-center gap-3 rounded-md border border-green-light-4 bg-white px-4 py-3 shadow-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green text-white">
          <svg
            aria-hidden="true"
            className="fill-current"
            width="14"
            height="14"
            viewBox="0 0 14 14"
          >
            <path d="M5.62 10.31 2.3 6.99l1.06-1.06 2.26 2.25 5.02-5.02 1.06 1.06-6.08 6.09Z" />
          </svg>
        </span>
        <p className="min-w-0 text-sm font-medium text-dark">
          {notification.message}
        </p>
      </div>
    </div>
  );
};

export default ToastNotification;
