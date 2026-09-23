import { test, expect } from '../fixtures';
import { PRODUCTS } from '../fixtures/data';

test.describe('GET /api/products', () => {
  test('lista todos os produtos', { tag: '@smoke' }, async ({ request }) => {
    const response = await request.get('/api/products');

    expect(response.status()).toBe(200);
    const { products } = await response.json();
    expect(products).toHaveLength(9);
    expect(products[0]).toEqual({
      id: expect.any(Number),
      slug: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      priceCents: expect.any(Number),
      stock: expect.any(Number),
      weightGrams: expect.any(Number),
    });
  });

  test('busca produto pelo slug', async ({ request }) => {
    const response = await request.get(`/api/products/${PRODUCTS.hub.slug}`);

    expect(response.status()).toBe(200);
    const { product } = await response.json();
    expect(product).toMatchObject({ slug: PRODUCTS.hub.slug, priceCents: PRODUCTS.hub.price });
  });

  test('retorna 404 para slug inexistente', async ({ request }) => {
    const response = await request.get('/api/products/nao-existe');

    expect(response.status()).toBe(404);
    expect((await response.json()).error.code).toBe('PRODUCT_NOT_FOUND');
  });
});
