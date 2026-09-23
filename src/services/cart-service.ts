import {
  addToCart,
  cartExists,
  findProductById,
  findProductBySlug,
  getCart,
  removeCartItem,
  setCartItemQuantity,
} from '@/db';
import { ServiceError } from '@/lib/errors';
import { RULES } from '@/lib/rules';
import type { Cart, Product } from '@/lib/types';

function assertCart(cartId: string) {
  if (!cartExists(cartId)) {
    throw new ServiceError('CART_NOT_FOUND', 'Carrinho não encontrado.', 404);
  }
}

function assertQuantity(product: Product, quantity: number) {
  // O limite por item é checado antes do estoque.
  if (quantity > RULES.MAX_QUANTITY_PER_ITEM) {
    throw new ServiceError(
      'MAX_QUANTITY_EXCEEDED',
      `Limite de ${RULES.MAX_QUANTITY_PER_ITEM} unidades por produto.`,
      422,
    );
  }
  if (quantity > product.stock) {
    throw new ServiceError(
      'INSUFFICIENT_STOCK',
      `Restam apenas ${product.stock} unidades em estoque.`,
      409,
    );
  }
}

interface AddItemInput {
  productSlug?: string;
  productId?: number;
  quantity: number;
}

export function addItem(cartId: string, { productSlug, productId, quantity }: AddItemInput): Cart {
  assertCart(cartId);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ServiceError('INVALID_QUANTITY', 'Quantidade inválida.', 400);
  }

  const product = productSlug ? findProductBySlug(productSlug) : findProductById(productId ?? 0);
  if (!product) {
    throw new ServiceError('PRODUCT_NOT_FOUND', 'Produto não encontrado.', 404);
  }
  if (product.stock === 0) {
    throw new ServiceError('OUT_OF_STOCK', 'Produto esgotado.', 409);
  }

  const current = getCart(cartId)!.items.find((i) => i.productId === product.id)?.quantity ?? 0;
  assertQuantity(product, current + quantity);

  addToCart(cartId, product.id, quantity);
  return getCart(cartId)!;
}

export function updateItem(cartId: string, productId: number, quantity: number): Cart {
  assertCart(cartId);

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new ServiceError('INVALID_QUANTITY', 'Quantidade inválida.', 400);
  }

  const product = findProductById(productId);
  if (!product) {
    throw new ServiceError('PRODUCT_NOT_FOUND', 'Produto não encontrado.', 404);
  }
  assertQuantity(product, quantity);

  setCartItemQuantity(cartId, productId, quantity);
  return getCart(cartId)!;
}

export function removeItem(cartId: string, productId: number): Cart {
  assertCart(cartId);
  removeCartItem(cartId, productId);
  return getCart(cartId)!;
}
