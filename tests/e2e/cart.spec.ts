import { test, expect } from '../fixtures';
import { brl } from '../fixtures/money';
import { PRODUCTS } from '../fixtures/data';

test.describe('Carrinho', () => {
  test('carrinho vazio', async ({ cartPage }) => {
    await cartPage.goto();

    await expect(cartPage.emptyMessage).toBeVisible();
  });

  test('exibe itens e subtotal', { tag: '@smoke' }, async ({ seedCart, cartPage }) => {
    await seedCart([{ slug: PRODUCTS.mouse.slug, quantity: 2 }, { slug: PRODUCTS.hub.slug }]);
    await cartPage.goto();

    await expect(cartPage.lineTotal(PRODUCTS.mouse.slug)).toHaveText(brl(PRODUCTS.mouse.price * 2));
    await expect(cartPage.subtotal).toHaveText(brl(PRODUCTS.mouse.price * 2 + PRODUCTS.hub.price));
  });

  test('alterar quantidade recalcula os valores', async ({ seedCart, cartPage }) => {
    await seedCart([{ slug: PRODUCTS.hub.slug }]);
    await cartPage.goto();

    await cartPage.setQuantity(PRODUCTS.hub.slug, 3);

    await expect(cartPage.lineTotal(PRODUCTS.hub.slug)).toHaveText(brl(PRODUCTS.hub.price * 3));
    await expect(cartPage.cartCount).toHaveText('3');
  });

  test('mostra erro ao passar do limite de 10 unidades', async ({ seedCart, cartPage }) => {
    await seedCart([{ slug: PRODUCTS.mouse.slug }]);
    await cartPage.goto();

    await cartPage.setQuantity(PRODUCTS.mouse.slug, 11);

    await expect(cartPage.error).toHaveText('Limite de 10 unidades por produto.');
  });

  test('remover o último item esvazia o carrinho', async ({ seedCart, cartPage }) => {
    await seedCart([{ slug: PRODUCTS.hub.slug }]);
    await cartPage.goto();

    await cartPage.remove(PRODUCTS.hub.slug);

    await expect(cartPage.emptyMessage).toBeVisible();
    await expect(cartPage.cartCount).toBeHidden();
  });

  test('BUG-002: falha no carregamento não aparece como carrinho vazio', async ({
    seedCart,
    cartPage,
    page,
  }) => {
    await seedCart([{ slug: PRODUCTS.hub.slug }]);
    await page.route(/\/api\/carts\/cart_[^/]+$/, (route) => route.fulfill({ status: 500 }));

    await cartPage.goto();

    await expect(cartPage.loadError).toContainText('HTTP 500');
    await expect(cartPage.emptyMessage).toBeHidden();
  });
});
