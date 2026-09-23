import type { Page } from '@playwright/test';

export class CartPage {
  readonly subtotal;
  readonly error;
  readonly loadError;
  readonly emptyMessage;
  readonly cartCount;

  constructor(private page: Page) {
    this.subtotal = page.getByTestId('cart-subtotal');
    this.error = page.getByTestId('cart-error');
    this.loadError = page.getByTestId('cart-load-error');
    this.emptyMessage = page.getByTestId('empty-cart');
    this.cartCount = page.getByTestId('cart-count');
  }

  async goto() {
    await this.page.goto('/carrinho');
  }

  item(slug: string) {
    return this.page.getByTestId(`cart-item-${slug}`);
  }

  lineTotal(slug: string) {
    return this.item(slug).getByTestId('line-total');
  }

  async setQuantity(slug: string, quantity: number) {
    const response = this.page.waitForResponse(
      (res) => res.url().includes('/items/') && res.request().method() === 'PATCH',
    );
    await this.item(slug).getByLabel('Quantidade').fill(String(quantity));
    await response;
  }

  async remove(slug: string) {
    await this.item(slug).getByRole('button', { name: 'Remover' }).click();
  }

  async checkout() {
    await this.page.getByRole('link', { name: 'Finalizar compra' }).click();
  }
}
