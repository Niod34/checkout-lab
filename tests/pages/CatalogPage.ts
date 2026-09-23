import type { Page } from '@playwright/test';

export class CatalogPage {
  readonly cartCount;

  constructor(private page: Page) {
    this.cartCount = page.getByTestId('cart-count');
  }

  async goto() {
    await this.page.goto('/');
  }

  product(slug: string) {
    return this.page.getByTestId(`product-${slug}`);
  }

  async addToCart(slug: string) {
    await this.product(slug).getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  }

  async openProduct(slug: string) {
    await this.product(slug).getByRole('link').click();
  }
}
