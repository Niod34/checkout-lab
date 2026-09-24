'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { notifyCartChanged, readCartId } from '@/lib/cart-client';
import { formatBRL } from '@/lib/money';
import type { ApiError } from '@/lib/api';
import type { Cart } from '@/lib/types';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const cartId = readCartId();
      try {
        const response = cartId ? await fetch(`/api/carts/${cartId}`) : null;
        if (response?.ok) {
          setCart(((await response.json()) as { cart: Cart }).cart);
        } else if (response && response.status !== 404) {
          // Erro de carregamento não pode aparecer como carrinho vazio (BUG-002).
          setLoadError(`Não foi possível carregar o carrinho (HTTP ${response.status}).`);
        }
      } catch {
        setLoadError('Não foi possível carregar o carrinho. Verifique sua conexão.');
      }
      setLoading(false);
    }
    load();
  }, []);

  async function updateCart(url: string, init: RequestInit) {
    setError(null);
    const response = await fetch(url, init);
    if (!response.ok) {
      setError(((await response.json()) as ApiError).error.message);
      return;
    }
    setCart(((await response.json()) as { cart: Cart }).cart);
    notifyCartChanged();
  }

  function changeQuantity(productId: number, quantity: number) {
    return updateCart(`/api/carts/${cart!.id}/items/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
  }

  function removeItem(productId: number) {
    return updateCart(`/api/carts/${cart!.id}/items/${productId}`, { method: 'DELETE' });
  }

  if (loading) return <p>Carregando...</p>;

  if (loadError) {
    return (
      <p className="alert error" data-testid="cart-load-error">
        {loadError}
      </p>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="card empty-state">
        <h1>Carrinho</h1>
        <p data-testid="empty-cart">Seu carrinho está vazio.</p>
        <Link href="/" className="button">
          Ver produtos
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  return (
    <>
      <h1>Carrinho</h1>

      <div className="two-columns">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Qtd.</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.productId} data-testid={`cart-item-${item.slug}`}>
                  <td>{item.name}</td>
                  <td>{formatBRL(item.unitPriceCents)}</td>
                  <td>
                    <input
                      className="qty-input"
                      type="number"
                      min={1}
                      value={item.quantity}
                      aria-label="Quantidade"
                      onChange={(e) => {
                        const quantity = Number(e.target.value);
                        if (quantity >= 1) changeQuantity(item.productId, quantity);
                      }}
                    />
                  </td>
                  <td data-testid="line-total">{formatBRL(item.unitPriceCents * item.quantity)}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => removeItem(item.productId)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {error && (
            <p className="alert error" data-testid="cart-error">
              {error}
            </p>
          )}
        </div>

        <aside className="card summary-card">
          <h2>Resumo</h2>
          <div className="totals">
            <div className="row grand">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">{formatBRL(subtotal)}</span>
            </div>
          </div>
          <p className="muted">Frete e cupons são calculados no checkout.</p>
          <Link href="/checkout" className="button block">
            Finalizar compra
          </Link>
        </aside>
      </div>
    </>
  );
}
