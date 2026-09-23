// O id do carrinho fica no localStorage do navegador.
export const CART_STORAGE_KEY = 'checkout-lab:cart-id';
export const CART_CHANGED_EVENT = 'checkout-lab:cart-changed';

export function readCartId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_STORAGE_KEY);
}

export function clearCartId() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function notifyCartChanged() {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export async function getOrCreateCartId(): Promise<string> {
  const existing = readCartId();
  if (existing) {
    const response = await fetch(`/api/carts/${existing}`);
    if (response.ok) return existing;
  }

  const response = await fetch('/api/carts', { method: 'POST' });
  const { cart } = (await response.json()) as { cart: { id: string } };
  localStorage.setItem(CART_STORAGE_KEY, cart.id);
  return cart.id;
}
