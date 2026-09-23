'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CART_CHANGED_EVENT, readCartId } from '@/lib/cart-client';
import type { Cart } from '@/lib/types';

export function SiteHeader() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function refresh() {
      const cartId = readCartId();
      const response = cartId ? await fetch(`/api/carts/${cartId}`) : null;
      if (!response?.ok) {
        setCount(0);
        return;
      }
      const { cart } = (await response.json()) as { cart: Cart };
      setCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
    }

    refresh();
    window.addEventListener(CART_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CART_CHANGED_EVENT, refresh);
  }, []);

  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="brand">
          Checkout Lab
        </Link>
        <Link href="/carrinho" data-testid="cart-link">
          Carrinho
          {count > 0 && (
            <span className="badge" data-testid="cart-count">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
