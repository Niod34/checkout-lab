import { test, expect } from '../fixtures';
import { PRODUCTS } from '../fixtures/data';

test.describe('Carrinho', () => {
  test('cria carrinho vazio', { tag: '@smoke' }, async ({ request }) => {
    const response = await request.post('/api/carts');

    expect(response.status()).toBe(201);
    const { cart } = await response.json();
    expect(cart.id).toMatch(/^cart_/);
    expect(cart.items).toEqual([]);
  });

  test('adiciona item', { tag: '@smoke' }, async ({ api }) => {
    const cartId = await api.createCart();
    const response = await api.addItem(cartId, PRODUCTS.mouse.slug, 2);

    expect(response.status()).toBe(201);
    const { cart } = await response.json();
    expect(cart.items).toEqual([
      expect.objectContaining({ slug: PRODUCTS.mouse.slug, quantity: 2 }),
    ]);
  });

  test('adicionar o mesmo produto soma a quantidade', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.mouse.slug, 2);
    const response = await api.addItem(cartId, PRODUCTS.mouse.slug, 3);

    const { cart } = await response.json();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(5);
  });

  for (const quantity of [0, -1, 1.5]) {
    test(`rejeita quantidade ${quantity}`, async ({ api }) => {
      const cartId = await api.createCart();
      const response = await api.addItem(cartId, PRODUCTS.mouse.slug, quantity);

      expect(response.status()).toBe(400);
      expect((await response.json()).error.code).toBe('INVALID_QUANTITY');
    });
  }

  test('aceita até 10 unidades do mesmo produto', async ({ api }) => {
    const cartId = await api.createCart();
    const response = await api.addItem(cartId, PRODUCTS.mouse.slug, 10);

    expect(response.status()).toBe(201);
  });

  test('rejeita a 11ª unidade, mesmo somando em duas chamadas', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.mouse.slug, 6);
    const response = await api.addItem(cartId, PRODUCTS.mouse.slug, 5);

    expect(response.status()).toBe(422);
    expect((await response.json()).error.code).toBe('MAX_QUANTITY_EXCEEDED');
  });

  test('rejeita produto esgotado', async ({ api }) => {
    const cartId = await api.createCart();
    const response = await api.addItem(cartId, PRODUCTS.headset.slug);

    expect(response.status()).toBe(409);
    expect((await response.json()).error.code).toBe('OUT_OF_STOCK');
  });

  test('rejeita quantidade maior que o estoque', async ({ api }) => {
    const cartId = await api.createCart();
    const response = await api.addItem(cartId, PRODUCTS.cadeira.slug, PRODUCTS.cadeira.stock + 1);

    expect(response.status()).toBe(409);
    expect((await response.json()).error.code).toBe('INSUFFICIENT_STOCK');
  });

  test('limite por item é validado antes do estoque', async ({ api }) => {
    // Monitor tem 5 em estoque: 11 unidades estouram as duas regras.
    const cartId = await api.createCart();
    const response = await api.addItem(cartId, PRODUCTS.monitor.slug, 11);

    expect((await response.json()).error.code).toBe('MAX_QUANTITY_EXCEEDED');
  });

  test('altera a quantidade de um item', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.mouse.slug, 2);
    const response = await api.updateItem(cartId, PRODUCTS.mouse.id, 7);

    expect(response.status()).toBe(200);
    expect((await response.json()).cart.items[0].quantity).toBe(7);
  });

  test('quantidade zero remove o item', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.mouse.slug, 2);
    const response = await api.updateItem(cartId, PRODUCTS.mouse.id, 0);

    expect((await response.json()).cart.items).toEqual([]);
  });

  test('remove item', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.mouse.slug);
    const response = await api.removeItem(cartId, PRODUCTS.mouse.id);

    expect(response.status()).toBe(200);
    expect((await response.json()).cart.items).toEqual([]);
  });

  test('retorna 404 para carrinho inexistente', async ({ api }) => {
    const response = await api.getCart('cart_inexistente');

    expect(response.status()).toBe(404);
    expect((await response.json()).error.code).toBe('CART_NOT_FOUND');
  });

  test('retorna 404 para produto inexistente', async ({ api }) => {
    const cartId = await api.createCart();
    const response = await api.addItem(cartId, 'nao-existe');

    expect(response.status()).toBe(404);
    expect((await response.json()).error.code).toBe('PRODUCT_NOT_FOUND');
  });
});
