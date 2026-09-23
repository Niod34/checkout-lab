import { test, expect } from '../fixtures';
import { brl } from '../fixtures/money';
import { CEP, CUSTOMER, PRODUCTS } from '../fixtures/data';
import { RULES } from '@/lib/rules';

const FRETE_BASE = RULES.BASE_SHIPPING_CENTS;

test.describe('Checkout', () => {
  test(
    'compra completa pela interface',
    { tag: '@smoke' },
    async ({ page, catalogPage, cartPage, checkoutPage }) => {
      const total = brl(PRODUCTS.mousepad.price * 2 + FRETE_BASE);

      await catalogPage.goto();
      await catalogPage.addToCart(PRODUCTS.mousepad.slug);
      await expect(catalogPage.cartCount).toHaveText('1');

      await page.getByTestId('cart-link').click();
      await cartPage.setQuantity(PRODUCTS.mousepad.slug, 2);
      await cartPage.checkout();

      await checkoutPage.calculateShipping(CEP.sudeste);
      await checkoutPage.fillCustomer(CUSTOMER.name, CUSTOMER.email);
      await expect(checkoutPage.total).toHaveText(total);

      await checkoutPage.placeOrder();

      await expect(page).toHaveURL(/\/pedido\/PED-/);
      await expect(page.getByTestId('total')).toHaveText(total);
      await expect(catalogPage.cartCount).toBeHidden();
    },
  );

  test('pedido mantém o desconto do cupom', async ({ page, seedCart, checkoutPage }) => {
    await seedCart([{ slug: PRODUCTS.mousepad.slug, quantity: 2 }]);
    await checkoutPage.goto();

    await checkoutPage.calculateShipping(CEP.sudeste);
    await checkoutPage.applyCoupon('FIXO25');
    await checkoutPage.fillCustomer(CUSTOMER.name, CUSTOMER.email);
    await checkoutPage.placeOrder();

    await expect(page.getByTestId('discount')).toHaveText(brl(2500));
  });

  test('mostra o frete conforme a região', async ({ seedCart, checkoutPage }) => {
    await seedCart([{ slug: PRODUCTS.hub.slug }]);
    await checkoutPage.goto();

    await checkoutPage.calculateShipping(CEP.sudeste);
    await expect(checkoutPage.shipping).toHaveText(brl(FRETE_BASE));

    await checkoutPage.calculateShipping(CEP.norte);
    await expect(checkoutPage.shipping).toHaveText(brl(FRETE_BASE + 2500));
  });

  test('CEP inválido mostra erro', async ({ seedCart, checkoutPage }) => {
    await seedCart([{ slug: PRODUCTS.hub.slug }]);
    await checkoutPage.goto();

    await checkoutPage.calculateShipping('1234');

    await expect(checkoutPage.quoteError).toHaveText('CEP inválido.');
  });

  test('cupom expirado mostra aviso e não dá desconto', async ({ seedCart, checkoutPage }) => {
    await seedCart([{ slug: PRODUCTS.hub.slug }]);
    await checkoutPage.goto();

    await checkoutPage.calculateShipping(CEP.sudeste);
    await checkoutPage.applyCoupon('VERAO2024');

    await expect(checkoutPage.couponRejected).toHaveText('Este cupom expirou.');
    await expect(checkoutPage.discount).toHaveText(brl(0));
  });

  test('BUG-001: cupom tira o frete grátis e o total aumenta', async ({
    seedCart,
    checkoutPage,
  }) => {
    await seedCart([{ slug: PRODUCTS.hub.slug, quantity: 2 }]);
    await checkoutPage.goto();

    await checkoutPage.calculateShipping(CEP.sudeste);
    await expect(checkoutPage.freeShippingTag).toBeVisible();
    await expect(checkoutPage.total).toHaveText(brl(20000));

    await checkoutPage.applyCoupon('DESCONTO5');

    await expect(checkoutPage.freeShippingTag).toBeHidden();
    await expect(checkoutPage.total).toHaveText(brl(19500 + FRETE_BASE));
  });

  test('não finaliza com e-mail inválido', async ({ page, seedCart, checkoutPage }) => {
    await seedCart([{ slug: PRODUCTS.mousepad.slug }]);
    await checkoutPage.goto();

    await checkoutPage.calculateShipping(CEP.sudeste);
    await checkoutPage.fillCustomer(CUSTOMER.name, 'maria.teste.com');
    await checkoutPage.placeOrder();

    await expect(checkoutPage.orderError).toHaveText('E-mail inválido.');
    await expect(page).toHaveURL('/checkout');
  });

  test('carrinho vazio não mostra o formulário', async ({ page, checkoutPage }) => {
    await checkoutPage.goto();

    await expect(checkoutPage.emptyMessage).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finalizar pedido' })).toBeHidden();
  });
});
