// Espelha a massa de src/db/seed-data.ts.
//
// Produtos que baixam estoque ficam reservados para um único arquivo de teste,
// para os testes em paralelo não disputarem o mesmo estoque:
//   webcam  -> tests/api/checkout.spec.ts
//   teclado -> teste de baixa de estoque (tests/api/checkout.spec.ts)
//   mousepad -> tests/e2e/checkout.spec.ts
export const PRODUCTS = {
  teclado: { id: 1, slug: 'teclado-mecanico-k1', price: 34990 },
  mouse: { id: 2, slug: 'mouse-vertical-ergo', price: 18990 },
  monitor: { id: 3, slug: 'monitor-27-4k', price: 199900 },
  cadeira: { id: 4, slug: 'cadeira-gamer-titan', price: 129900, stock: 3 },
  headset: { id: 5, slug: 'headset-studio-h5', price: 24990 },
  webcam: { id: 6, slug: 'webcam-hd-pro', price: 15900 },
  mousepad: { id: 7, slug: 'mousepad-xl', price: 9995 },
  hub: { id: 8, slug: 'hub-usbc-7em1', price: 10000 },
  halteres: { id: 9, slug: 'kit-halteres-12kg', price: 8990 },
};

export const CEP = {
  sudeste: '01310-100',
  sul: '80010-000',
  centroOeste: '70040-010',
  nordeste: '40020-000',
  norte: '66010-000',
};

export const CUSTOMER = {
  name: 'Maria Souza',
  email: 'maria.souza@teste.com',
};
