'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearCartId, notifyCartChanged, readCartId } from '@/lib/cart-client';
import { formatBRL } from '@/lib/money';
import type { ApiError } from '@/lib/api';
import type { Cart, Order, Quote } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({ cep: '', coupon: '', name: '', email: '' });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const cartId = readCartId();
      try {
        const response = cartId ? await fetch(`/api/carts/${cartId}`) : null;
        if (response?.ok) {
          setCart(((await response.json()) as { cart: Cart }).cart);
        } else if (response && response.status !== 404) {
          setLoadError(`Não foi possível carregar o carrinho (HTTP ${response.status}).`);
        }
      } catch {
        setLoadError('Não foi possível carregar o carrinho. Verifique sua conexão.');
      }
      setLoading(false);
    }
    load();
  }, []);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function calculate() {
    setQuoteError(null);
    const response = await fetch(`/api/carts/${cart!.id}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cep: form.cep, couponCode: form.coupon || null }),
    });

    if (!response.ok) {
      setQuote(null);
      setQuoteError(((await response.json()) as ApiError).error.message);
      return;
    }
    setQuote(((await response.json()) as { quote: Quote }).quote);
  }

  async function placeOrder() {
    setSubmitting(true);
    setOrderError(null);

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartId: cart!.id,
        cep: form.cep,
        couponCode: form.coupon || null,
        customer: { name: form.name, email: form.email },
      }),
    });

    if (!response.ok) {
      setOrderError(((await response.json()) as ApiError).error.message);
      setSubmitting(false);
      return;
    }

    const { order } = (await response.json()) as { order: Order };
    clearCartId();
    notifyCartChanged();
    router.push(`/pedido/${order.id}`);
  }

  if (loading) return <p>Carregando...</p>;

  if (loadError) {
    return (
      <p className="alert error" data-testid="checkout-load-error">
        {loadError}
      </p>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="card empty-state">
        <h1>Checkout</h1>
        <p data-testid="empty-cart">Seu carrinho está vazio.</p>
        <Link href="/" className="button">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1>Checkout</h1>

      <div className="two-columns">
        <div className="stack">
          <section className="card">
            <h2>Entrega</h2>
            <div className="row-inline">
              <div className="field">
                <label htmlFor="cep">CEP</label>
                <input
                  id="cep"
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={(e) => update('cep', e.target.value)}
                />
              </div>
              <button type="button" className="outline" onClick={calculate}>
                Calcular frete
              </button>
            </div>
            {quoteError && (
              <p className="alert error" data-testid="quote-error">
                {quoteError}
              </p>
            )}
          </section>

          <section className="card">
            <h2>Cupom de desconto</h2>
            <div className="row-inline">
              <div className="field">
                <label htmlFor="coupon">Cupom</label>
                <input
                  id="coupon"
                  value={form.coupon}
                  onChange={(e) => update('coupon', e.target.value)}
                />
              </div>
              <button type="button" className="outline" onClick={calculate}>
                Aplicar cupom
              </button>
            </div>
            {quote?.appliedCoupon && (
              <p className="alert success" data-testid="coupon-applied">
                Cupom {quote.appliedCoupon} aplicado.
              </p>
            )}
            {quote?.couponRejection && (
              <p className="alert error" data-testid="coupon-rejected">
                {quote.couponRejection.message}
              </p>
            )}
          </section>

          <section className="card">
            <h2>Seus dados</h2>
            <div className="field">
              <label htmlFor="name">Nome completo</label>
              <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
          </section>
        </div>

        <aside className="card summary-card">
          <h2>Resumo do pedido</h2>

          {cart.items.map((item) => (
            <div key={item.productId} className="totals">
              <div className="row">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>{formatBRL(item.unitPriceCents * item.quantity)}</span>
              </div>
            </div>
          ))}

          {quote ? (
            <div className="totals" data-testid="summary">
              <hr className="divider" />
              <div className="row">
                <span>Subtotal</span>
                <span data-testid="subtotal">{formatBRL(quote.subtotalCents)}</span>
              </div>
              <div className="row">
                <span>Desconto</span>
                <span data-testid="discount">- {formatBRL(quote.discountCents)}</span>
              </div>
              <div className="row">
                <span>Frete {quote.freeShipping && <span className="tag">grátis</span>}</span>
                <span data-testid="shipping">{formatBRL(quote.shippingCents)}</span>
              </div>
              <div className="row grand">
                <span>Total</span>
                <span data-testid="total">{formatBRL(quote.totalCents)}</span>
              </div>
            </div>
          ) : (
            <p className="muted">Informe o CEP para calcular o frete.</p>
          )}

          {orderError && (
            <p className="alert error" data-testid="order-error">
              {orderError}
            </p>
          )}

          <button type="button" className="block" onClick={placeOrder} disabled={submitting}>
            Finalizar pedido
          </button>
        </aside>
      </div>
    </>
  );
}
