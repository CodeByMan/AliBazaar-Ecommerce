import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useDispatch } from 'react-redux';
import {
  removeItemFromCart,
  updateCartItemQuantity,
  type CartItem,
} from '@/redux/features/cart-slice';
import { AppDispatch } from '@/redux/store';
import { formatPKR } from '@/lib/currency';

const SingleItem = ({ item }: { item: CartItem }) => {
  const dispatch = useDispatch<AppDispatch>();
  const image = item.imgs?.thumbnails?.[0] || item.image || '/images/placeholder-product.svg';

  return (
    <article className="grid grid-cols-1 gap-5 border-t border-gray-3 px-4 py-5 sm:px-7.5 md:grid-cols-[minmax(0,2fr)_1fr_1.25fr_1fr_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[5px] bg-gray-2 p-2">
          <Image width={80} height={80} src={image} alt={item.title} className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <Link href={`/shop-details?id=${item.id}`} className="line-clamp-2 font-medium text-dark hover:text-blue">
            {item.title}
          </Link>
          <p className="mt-1 text-custom-xs text-dark-4">{item.stock} available</p>
        </div>
      </div>

      <div>
        <span className="mb-1 block text-custom-xs text-dark-4 md:hidden">Price</span>
        <p className="text-dark">{formatPKR(item.discountedPrice)}</p>
      </div>

      <div>
        <span className="mb-1 block text-custom-xs text-dark-4 md:hidden">Quantity</span>
        <div className="flex w-max items-center rounded-md border border-gray-3">
          <button
            type="button"
            onClick={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity - 1 }))}
            disabled={item.quantity <= 1}
            aria-label={`Decrease ${item.title} quantity`}
            className="flex h-10 w-10 items-center justify-center hover:text-blue disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span className="flex h-10 w-14 items-center justify-center border-x border-gray-3">{item.quantity}</span>
          <button
            type="button"
            onClick={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity + 1 }))}
            disabled={item.quantity >= item.stock}
            aria-label={`Increase ${item.title} quantity`}
            className="flex h-10 w-10 items-center justify-center hover:text-blue disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        {item.quantity >= item.stock && (
          <p className="mt-1 text-custom-xs text-red">Maximum available quantity reached.</p>
        )}
      </div>

      <div>
        <span className="mb-1 block text-custom-xs text-dark-4 md:hidden">Subtotal</span>
        <p className="font-medium text-dark">{formatPKR(item.discountedPrice * item.quantity)}</p>
      </div>

      <button
        type="button"
        onClick={() => dispatch(removeItemFromCart(item.id))}
        aria-label={`Remove ${item.title} from cart`}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-3 bg-gray-2 text-dark hover:border-red-light-4 hover:bg-red-light-6 hover:text-red"
      >
        ×
      </button>
    </article>
  );
};

export default SingleItem;
