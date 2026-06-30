"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import PreviewSliderModal from "@/components/Common/PreviewSlider";
import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";
import ToastNotification from "@/components/Common/ToastNotification";
import { ModalProvider } from "@/app/context/QuickViewModalContext";
import { CartModalProvider } from "@/app/context/CartSidebarModalContext";
import { PreviewSliderProvider } from "@/app/context/PreviewSliderContext";
import { ReduxProvider } from "@/redux/provider";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timeout);
  }, []);

  if (loading) return <PreLoader />;

  return (
    <ReduxProvider>
      <CartModalProvider>
        <ModalProvider>
          <PreviewSliderProvider>
            <Header />
            {children}
            <QuickViewModal />
            <CartSidebarModal />
            <PreviewSliderModal />
            <ToastNotification />
          </PreviewSliderProvider>
        </ModalProvider>
      </CartModalProvider>
      <ScrollToTop />
      <Footer />
    </ReduxProvider>
  );
}
