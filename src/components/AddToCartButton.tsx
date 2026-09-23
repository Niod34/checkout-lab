'use client';

import { useState } from 'react';
import { getOrCreateCartId, notifyCartChanged } from '@/lib/cart-client';
import type { ApiError } from '@/lib/api';

interface Props {
  slug: string;
  disabled?: boolean;
}

export function AddToCartButton({ slug, disabled = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);

    try {
      const cartId = await getOrCreateCartId();
      const response = await fetch(`/api/carts/${cartId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug: slug, quantity: 1 }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Produto adicionado ao carrinho.' });
        notifyCartChanged();
      } else {
        const { error } = (await response.json()) as ApiError;
        setMessage({ type: 'error', text: error.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        data-testid={`add-to-cart-${slug}`}
      >
        {disabled ? 'Indisponível' : 'Adicionar ao carrinho'}
      </button>
      {message && (
        <p className={`alert ${message.type}`} data-testid={`add-${message.type}-${slug}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
