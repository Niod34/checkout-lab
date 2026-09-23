import { test as base, expect } from '@playwright/test';
import { ApiClient } from './api-client';
import { CartPage } from '../pages/CartPage';
import { CatalogPage } from '../pages/CatalogPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CART_STORAGE_KEY } from '@/lib/cart-client';

type Fixtures = {
  api: ApiClient;
  seedCart: (items: { slug: string; quantity?: number }[]) => Promise<string>;
  catalogPage: CatalogPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  // Monta o carrinho pela API e já deixa o id no localStorage antes de abrir a página.
  seedCart: async ({ page, api }, use) => {
    await use(async (items) => {
      const cartId = await api.createCart();
      for (const { slug, quantity = 1 } of items) {
        const response = await api.addItem(cartId, slug, quantity);
        expect(response.ok(), `adicionar ${slug} ao carrinho`).toBeTruthy();
      }
      await page.addInitScript(
        ([key, id]) => localStorage.setItem(key, id),
        [CART_STORAGE_KEY, cartId],
      );
      return cartId;
    });
  },

  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect };
