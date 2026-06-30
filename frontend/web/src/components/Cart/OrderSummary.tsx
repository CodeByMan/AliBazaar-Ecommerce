import Link from 'next/link';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectTotalPrice } from '@/redux/features/cart-slice';
import { useAppSelector } from '@/redux/store';
import { formatPKR } from '@/lib/currency';

const OrderSummary = () => {
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const totalPrice = useSelector(selectTotalPrice);

  return (
    <div className="w-full lg:max-w-[455px]">
      <div className="rounded-[10px] bg-white shadow-1">
        <div className="border-b border-gray-3 px-4 py-5 sm:px-8.5">
          <h3 className="font-medium text-xl text-dark">Order Summary</h3>
        </div>
        <div className="px-4 pb-8.5 pt-2.5 sm:px-8.5">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-5 border-b border-gray-3 py-5">
              <p className="min-w-0 text-dark">
                {item.title} <span className="text-dark-4">× {item.quantity}</span>
              </p>
              <p className="whitespace-nowrap text-right text-dark">
                {formatPKR(item.discountedPrice * item.quantity)}
              </p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-5">
            <p className="font-medium text-lg text-dark">Subtotal</p>
            <p className="font-medium text-lg text-dark">{formatPKR(totalPrice)}</p>
          </div>
          <p className="mt-2 text-custom-xs text-dark-4">Delivery charges are calculated securely at checkout.</p>
          <Link
            href="/checkout"
            className="mt-7.5 flex w-full justify-center rounded-md bg-blue px-6 py-3 font-medium text-white hover:bg-blue-dark"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
