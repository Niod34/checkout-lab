import { test, expect } from '../fixtures';
import { CEP, CUSTOMER, PRODUCTS } from '../fixtures/data';

test.describe('Checkout', () => {
  test('finaliza o pedido', { tag: '@smoke' }, async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.webcam.slug);
    const response = await api.checkout(cartId, CEP.sudeste);

    expect(response.status()).toBe(201);
    const { order } = await response.json();
    expect(order.id).toMatch(/^PED-[0-9A-F]{8}$/);
    expect(order.customer).toEqual({ ...CUSTOMER, cep: '01310100' });
    expect(order.items[0].slug).toBe(PRODUCTS.webcam.slug);
  });

  test('pedido fica disponível para consulta', async ({ api, request }) => {
    const cartId = await api.cartWith(PRODUCTS.webcam.slug);
    const { order } = await (await api.checkout(cartId, CEP.sudeste)).json();

    const response = await request.get(`/api/orders/${order.id}`);
    expect(response.status()).toBe(200);
    expect((await response.json()).order.quote.totalCents).toBe(order.quote.totalCents);
  });

  test('esvazia o carrinho depois do pedido', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.webcam.slug);
    await api.checkout(cartId, CEP.sudeste);

    const { cart } = await (await api.getCart(cartId)).json();
    expect(cart.items).toEqual([]);
  });

  test('não permite fechar o mesmo carrinho duas vezes', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.webcam.slug);
    await api.checkout(cartId, CEP.sudeste);
    const response = await api.checkout(cartId, CEP.sudeste);

    expect(response.status()).toBe(422);
    expect((await response.json()).error.code).toBe('EMPTY_CART');
  });

  test('baixa o estoque só na finalização', async ({ api }) => {
    const estoqueInicial = await api.getStock(PRODUCTS.teclado.slug);

    const cartId = await api.cartWith(PRODUCTS.teclado.slug, 2);
    expect(await api.getStock(PRODUCTS.teclado.slug)).toBe(estoqueInicial);

    await api.checkout(cartId, CEP.sudeste);
    expect(await api.getStock(PRODUCTS.teclado.slug)).toBe(estoqueInicial - 2);
  });

  test.describe('validação dos dados do cliente', () => {
    const invalidos = [
      { caso: 'nome vazio', customer: { ...CUSTOMER, name: '' } },
      { caso: 'nome com 2 letras', customer: { ...CUSTOMER, name: 'Jo' } },
      { caso: 'e-mail sem @', customer: { ...CUSTOMER, email: 'maria.teste.com' } },
      { caso: 'e-mail sem domínio', customer: { ...CUSTOMER, email: 'maria@' } },
      { caso: 'e-mail sem ponto no domínio', customer: { ...CUSTOMER, email: 'maria@teste' } },
    ];

    for (const { caso, customer } of invalidos) {
      test(`rejeita ${caso}`, async ({ api }) => {
        const cartId = await api.cartWith(PRODUCTS.webcam.slug);
        const response = await api.checkout(cartId, CEP.sudeste, customer);

        expect(response.status()).toBe(422);
        expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
      });
    }

    test('aceita nome com 3 letras', async ({ api }) => {
      const cartId = await api.cartWith(PRODUCTS.webcam.slug);
      const response = await api.checkout(cartId, CEP.sudeste, { ...CUSTOMER, name: 'Ana' });

      expect(response.status()).toBe(201);
    });
  });

  test('rejeita CEP inválido', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.webcam.slug);
    const response = await api.checkout(cartId, 'ABCDEFGH');

    expect(response.status()).toBe(422);
    expect((await response.json()).error.code).toBe('INVALID_CEP');
  });

  test('rejeita requisição sem cartId', async ({ request }) => {
    const response = await request.post('/api/checkout', { data: { cep: CEP.sudeste } });

    expect(response.status()).toBe(400);
  });
});
