import { test, expect } from '../fixtures';
import { brl } from '../fixtures/money';
import { PRODUCTS } from '../fixtures/data';

test.describe('Catálogo', () => {
  test.beforeEach(async ({ catalogPage }) => {
    await catalogPage.goto();
  });

  test('exibe preço e estoque dos produtos', async ({ catalogPage }) => {
    const hub = catalogPage.product(PRODUCTS.hub.slug);

    await expect(hub.getByTestId('price')).toHaveText(brl(PRODUCTS.hub.price));
    await expect(hub.getByTestId('stock')).toHaveText('12 em estoque');
  });

  test('produto esgotado não pode ser adicionado', async ({ catalogPage }) => {
    const headset = catalogPage.product(PRODUCTS.headset.slug);

    await expect(headset.getByTestId('stock')).toHaveText('Esgotado');
    await expect(headset.getByRole('button')).toBeDisabled();
  });

  test(
    'adicionar produto atualiza o contador do carrinho',
    { tag: '@smoke' },
    async ({ catalogPage }) => {
      await expect(catalogPage.cartCount).toBeHidden();

      await catalogPage.addToCart(PRODUCTS.mouse.slug);

      await expect(catalogPage.product(PRODUCTS.mouse.slug)).toContainText(
        'Produto adicionado ao carrinho.',
      );
      await expect(catalogPage.cartCount).toHaveText('1');
    },
  );

  test('abre a página do produto', async ({ catalogPage, page }) => {
    await catalogPage.openProduct(PRODUCTS.cadeira.slug);

    await expect(page).toHaveURL(`/produto/${PRODUCTS.cadeira.slug}`);
    await expect(page.getByTestId('product-name')).toHaveText('Cadeira Gamer Titan');
    await expect(page.getByTestId('product-weight')).toHaveText('Peso: 22,00 kg');
  });

  test('produto inexistente mostra página 404', async ({ page }) => {
    await page.goto('/produto/nao-existe');

    await expect(page.getByTestId('not-found')).toBeVisible();
  });
});
