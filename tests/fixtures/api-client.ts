import type { APIRequestContext } from '@playwright/test';
import { CUSTOMER } from './data';

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async createCart(): Promise<string> {
    const response = await this.request.post('/api/carts');
    const { cart } = await response.json();
    return cart.id;
  }

  addItem(cartId: string, productSlug: string, quantity = 1) {
    return this.request.post(`/api/carts/${cartId}/items`, { data: { productSlug, quantity } });
  }

  updateItem(cartId: string, productId: number, quantity: number) {
    return this.request.patch(`/api/carts/${cartId}/items/${productId}`, { data: { quantity } });
  }

  removeItem(cartId: string, productId: number) {
    return this.request.delete(`/api/carts/${cartId}/items/${productId}`);
  }

  getCart(cartId: string) {
    return this.request.get(`/api/carts/${cartId}`);
  }

  quote(cartId: string, cep: string, couponCode?: string) {
    return this.request.post(`/api/carts/${cartId}/quote`, { data: { cep, couponCode } });
  }

  checkout(cartId: string, cep: string, customer: { name?: string; email?: string } = CUSTOMER) {
    return this.request.post('/api/checkout', { data: { cartId, cep, customer } });
  }

  async getStock(slug: string): Promise<number> {
    const response = await this.request.get(`/api/products/${slug}`);
    const { product } = await response.json();
    return product.stock;
  }

  async cartWith(productSlug: string, quantity = 1): Promise<string> {
    const cartId = await this.createCart();
    await this.addItem(cartId, productSlug, quantity);
    return cartId;
  }
}
