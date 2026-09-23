import { test, expect } from '../fixtures';
import { CEP, PRODUCTS } from '../fixtures/data';
import { RULES } from '@/lib/rules';

const { BASE_SHIPPING_CENTS: FRETE_BASE } = RULES;

test.describe('Orçamento', () => {
  test('calcula subtotal, frete e total', { tag: '@smoke' }, async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.mouse.slug);
    const response = await api.quote(cartId, CEP.sudeste);

    expect(response.status()).toBe(200);
    const { quote } = await response.json();
    expect(quote).toMatchObject({
      subtotalCents: PRODUCTS.mouse.price,
      discountCents: 0,
      shippingCents: FRETE_BASE,
      totalCents: PRODUCTS.mouse.price + FRETE_BASE,
      shippingRegion: 'SUDESTE',
    });
  });

  test.describe('frete grátis a partir de R$ 200,00', () => {
    test('R$ 199,90 paga frete', async ({ api }) => {
      const cartId = await api.cartWith(PRODUCTS.mousepad.slug, 2);
      const { quote } = await (await api.quote(cartId, CEP.sudeste)).json();

      expect(quote.subtotalCents).toBe(19990);
      expect(quote.freeShipping).toBe(false);
    });

    test('R$ 200,00 tem frete grátis', async ({ api }) => {
      const cartId = await api.cartWith(PRODUCTS.hub.slug, 2);
      const { quote } = await (await api.quote(cartId, CEP.sudeste)).json();

      expect(quote.subtotalCents).toBe(20000);
      expect(quote.freeShipping).toBe(true);
      expect(quote.shippingCents).toBe(0);
    });
  });

  const regioes = [
    { cep: CEP.sudeste, regiao: 'SUDESTE', adicional: 0 },
    { cep: CEP.sul, regiao: 'SUL', adicional: 800 },
    { cep: CEP.centroOeste, regiao: 'CENTRO_OESTE', adicional: 1200 },
    { cep: CEP.nordeste, regiao: 'NORDESTE', adicional: 1800 },
    { cep: CEP.norte, regiao: 'NORTE', adicional: 2500 },
  ];

  for (const { cep, regiao, adicional } of regioes) {
    test(`frete para ${regiao}`, async ({ api }) => {
      const cartId = await api.cartWith(PRODUCTS.hub.slug);
      const { quote } = await (await api.quote(cartId, cep)).json();

      expect(quote.shippingRegion).toBe(regiao);
      expect(quote.shippingCents).toBe(FRETE_BASE + adicional);
    });
  }

  test('pedido acima de 10 kg paga adicional de peso', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.halteres.slug);
    const { quote } = await (await api.quote(cartId, CEP.sudeste)).json();

    expect(quote.shippingCents).toBe(FRETE_BASE + RULES.HEAVY_SURCHARGE_CENTS);
  });

  test.describe('cupons', () => {
    test('aplica cupom percentual', { tag: '@smoke' }, async ({ api }) => {
      const cartId = await api.cartWith(PRODUCTS.hub.slug);
      const { quote } = await (await api.quote(cartId, CEP.sudeste, 'BEMVINDO10')).json();

      expect(quote.appliedCoupon).toBe('BEMVINDO10');
      expect(quote.discountCents).toBe(1000);
    });

    test('desconto percentual respeita o teto do cupom', async ({ api }) => {
      // 50% de R$ 1.999,00 passaria do teto de R$ 80,00 do MEGA50
      const cartId = await api.cartWith(PRODUCTS.monitor.slug);
      const { quote } = await (await api.quote(cartId, CEP.sudeste, 'MEGA50')).json();

      expect(quote.discountCents).toBe(8000);
    });

    test('cupom fixo nunca deixa o total negativo', async ({ api }) => {
      const cartId = await api.cartWith(PRODUCTS.hub.slug);
      const { quote } = await (await api.quote(cartId, CEP.sudeste, 'FIXO500')).json();

      expect(quote.discountCents).toBe(PRODUCTS.hub.price);
      expect(quote.totalCents).toBeGreaterThanOrEqual(0);
    });

    test('ignora maiúsculas e espaços no código', async ({ api }) => {
      const cartId = await api.cartWith(PRODUCTS.hub.slug);
      const { quote } = await (await api.quote(cartId, CEP.sudeste, '  bemvindo10 ')).json();

      expect(quote.appliedCoupon).toBe('BEMVINDO10');
    });

    const recusados = [
      { codigo: 'NAOEXISTE', erro: 'INVALID_COUPON' },
      { codigo: 'DESATIVADO', erro: 'INACTIVE_COUPON' },
      { codigo: 'VERAO2024', erro: 'EXPIRED_COUPON' },
    ];

    for (const { codigo, erro } of recusados) {
      test(`recusa cupom ${codigo} com ${erro}`, async ({ api }) => {
        const cartId = await api.cartWith(PRODUCTS.hub.slug);
        const response = await api.quote(cartId, CEP.sudeste, codigo);

        // Cupom recusado não é erro HTTP: o orçamento vem sem desconto.
        expect(response.status()).toBe(200);
        const { quote } = await response.json();
        expect(quote.couponRejection.code).toBe(erro);
        expect(quote.discountCents).toBe(0);
      });
    }

    test('recusa cupom quando o subtotal não atinge o mínimo', async ({ api }) => {
      // MEGA50 exige R$ 100,00 e o mousepad custa R$ 99,95
      const cartId = await api.cartWith(PRODUCTS.mousepad.slug);
      const { quote } = await (await api.quote(cartId, CEP.sudeste, 'MEGA50')).json();

      expect(quote.couponRejection.code).toBe('MIN_SUBTOTAL_NOT_MET');
    });
  });

  test('BUG-001: cupom pequeno aumenta o total ao tirar o frete grátis', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.hub.slug, 2);

    const semCupom = (await (await api.quote(cartId, CEP.sudeste)).json()).quote;
    const comCupom = (await (await api.quote(cartId, CEP.sudeste, 'DESCONTO5')).json()).quote;

    // Comportamento atual, documentado em docs/bugs/BUG-001.md
    expect(semCupom.totalCents).toBe(20000);
    expect(comCupom.totalCents).toBe(19500 + FRETE_BASE);
  });

  test('rejeita CEP inválido', async ({ api }) => {
    const cartId = await api.cartWith(PRODUCTS.hub.slug);
    const response = await api.quote(cartId, '1234');

    expect(response.status()).toBe(422);
    expect((await response.json()).error.code).toBe('INVALID_CEP');
  });

  test('rejeita carrinho vazio', async ({ api }) => {
    const cartId = await api.createCart();
    const response = await api.quote(cartId, CEP.sudeste);

    expect(response.status()).toBe(422);
    expect((await response.json()).error.code).toBe('EMPTY_CART');
  });
});
