import { clearCart, createOrder, decrementStock, findCoupon, findProductById, getCart } from '@/db';
import { ServiceError } from '@/lib/errors';
import { buildQuote } from '@/lib/pricing';
import { isValidCep, normalizeCep } from '@/lib/rules';
import type { Order, Quote } from '@/lib/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function quoteCart(cartId: string, cep: string, couponCode?: string | null): Quote {
  const cart = getCart(cartId);
  if (!cart) {
    throw new ServiceError('CART_NOT_FOUND', 'Carrinho não encontrado.', 404);
  }
  if (cart.items.length === 0) {
    throw new ServiceError('EMPTY_CART', 'O carrinho está vazio.', 422);
  }
  if (!isValidCep(cep)) {
    throw new ServiceError('INVALID_CEP', 'CEP inválido.', 422);
  }

  // Cupom recusado não é erro: o orçamento volta com couponRejection preenchido.
  const code = couponCode?.trim() || null;
  return buildQuote({
    items: cart.items,
    cep,
    couponCode: code,
    coupon: code ? findCoupon(code) : null,
  });
}

interface PlaceOrderInput {
  cartId: string;
  cep: string;
  couponCode?: string | null;
  name?: string;
  email?: string;
}

export function placeOrder(input: PlaceOrderInput): Order {
  const name = input.name?.trim() ?? '';
  const email = input.email?.trim() ?? '';

  if (name.length < 3) {
    throw new ServiceError('VALIDATION_ERROR', 'Informe o nome completo.', 422);
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new ServiceError('VALIDATION_ERROR', 'E-mail inválido.', 422);
  }

  const quote = quoteCart(input.cartId, input.cep, input.couponCode);
  const cart = getCart(input.cartId)!;

  // O estoque pode ter mudado desde que o item entrou no carrinho.
  for (const item of cart.items) {
    const product = findProductById(item.productId);
    if (!product || product.stock < item.quantity) {
      throw new ServiceError('INSUFFICIENT_STOCK', `Estoque insuficiente para ${item.name}.`, 409);
    }
  }

  const order: Order = {
    id: `PED-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    customer: { name, email, cep: normalizeCep(input.cep) },
    items: cart.items,
    quote,
    createdAt: new Date().toISOString(),
  };

  createOrder(order);
  cart.items.forEach((item) => decrementStock(item.productId, item.quantity));
  clearCart(input.cartId);

  return order;
}
