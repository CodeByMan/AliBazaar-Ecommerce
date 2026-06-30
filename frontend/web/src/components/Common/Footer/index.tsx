import Link from "next/link";

const Footer = () => {
  return (
    <footer className="overflow-hidden bg-white">
      <div className="border-t border-gray-3 py-12.5 xl:py-17.5">
        <div className="mx-auto grid max-w-[1170px] grid-cols-1 gap-10 px-4 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 xl:px-0">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center text-3xl font-bold tracking-tight text-dark" aria-label="AliBazaar home">
              <span className="text-blue">Ali</span>Bazaar
            </Link>
            <p className="mt-5 max-w-[300px] text-dark-4">
              A secure online marketplace with products priced in Pakistani Rupees, Stripe payments, and transparent order tracking.
            </p>
          </div>

          <div>
            <h2 className="mb-6 text-custom-1 font-medium text-dark">Shop</h2>
            <ul className="flex flex-col gap-3.5">
              <li><Link className="duration-200 hover:text-blue" href="/shop-with-sidebar">All Products</Link></li>
              <li><Link className="duration-200 hover:text-blue" href="/cart">Cart</Link></li>
              <li><Link className="duration-200 hover:text-blue" href="/wishlist">Wishlist</Link></li>
              <li><Link className="duration-200 hover:text-blue" href="/checkout">Checkout</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-6 text-custom-1 font-medium text-dark">Customer Care</h2>
            <ul className="flex flex-col gap-3.5">
              <li><Link className="duration-200 hover:text-blue" href="/track-order">Track Order</Link></li>
              <li><Link className="duration-200 hover:text-blue" href="/my-account">My Account</Link></li>
              <li><Link className="duration-200 hover:text-blue" href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-6 text-custom-1 font-medium text-dark">Secure Payments</h2>
            <p className="text-dark-4">Payments are processed securely through Stripe. Card details are never stored by AliBazaar.</p>
            <p className="mt-4 font-medium text-dark">Currency: PKR</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-1 py-5 xl:py-7.5">
        <div className="mx-auto flex max-w-[1170px] flex-col items-center justify-between gap-3 px-4 text-center sm:px-8 md:flex-row md:text-left xl:px-0">
          <p className="font-medium text-dark">Developed by Muhammad Ali Nawaz © 2026</p>
          <p className="text-custom-sm text-dark-4">AliBazaar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
