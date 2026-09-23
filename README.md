# Checkout Lab

[![CI](https://github.com/Niod34/checkout-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/Niod34/checkout-lab/actions/workflows/ci.yml)

Projeto de automação de testes com **Playwright + TypeScript**. Construí uma loja
simples em Next.js para servir de alvo e escrevi testes de API e E2E cobrindo as
regras de carrinho, frete, cupons e checkout.

📊 [Último relatório de testes](https://niod34.github.io/checkout-lab/)

## Stack

- **Testes:** Playwright, TypeScript
- **Aplicação:** Next.js, React, SQLite (`node:sqlite`)
- **CI:** GitHub Actions, relatório publicado no GitHub Pages

## O que é testado

**API (52 testes)**

- Produtos: listagem, busca e 404
- Carrinho: adicionar, alterar, remover, limite de 10 unidades por item, estoque
- Orçamento: frete por região, frete grátis a partir de R$ 200, adicional de peso, cupons
- Checkout: criação do pedido, baixa de estoque, validação de nome, e-mail e CEP

**E2E (19 testes)**

- Catálogo, carrinho e checkout pela interface
- Compra completa do catálogo até a confirmação do pedido
- Mensagens de erro (CEP inválido, cupom expirado, e-mail inválido)
- Simulação de falha da API com `page.route`

Os testes marcados com `@smoke` cobrem os fluxos principais.

## Estrutura

```
tests/
├── api/          # testes de API
├── e2e/          # testes de interface
├── pages/        # page objects
└── fixtures/     # fixtures, cliente da API e massa de dados
```

Algumas decisões:

- **Page Objects** para as telas de catálogo, carrinho e checkout.
- **Setup pela API:** nos testes E2E o carrinho é montado via API e o id é injetado
  no `localStorage`, então cada teste começa direto na tela que está testando.
- **Massa de dados controlada:** a aplicação tem um endpoint `POST /api/test/reset`
  (disponível só em ambiente de teste) chamado uma vez antes da suíte.
- **Testes em paralelo:** cada teste cria o próprio carrinho, e os produtos que têm
  estoque baixado são usados por um único arquivo de teste.

## Bugs encontrados

| ID                              | Descrição                                                 | Status    |
| ------------------------------- | --------------------------------------------------------- | --------- |
| [BUG-001](docs/bugs/BUG-001.md) | Cupom de desconto pode aumentar o total do pedido         | Aberto    |
| [BUG-002](docs/bugs/BUG-002.md) | Erro ao carregar o carrinho aparece como "carrinho vazio" | Corrigido |

## Como rodar

Requisito: Node.js 24+

```bash
npm install
npx playwright install chromium
```

```bash
npm test              # todos os testes (sobe a aplicação automaticamente)
npm run test:api      # só API
npm run test:e2e      # só E2E
npm run test:smoke    # só @smoke
npm run report        # abre o relatório HTML
```

Para usar a aplicação manualmente: `npm run dev` e acessar http://localhost:3000.

### Cupons disponíveis

| Cupom        | Regra                                     |
| ------------ | ----------------------------------------- |
| `BEMVINDO10` | 10% (mínimo R$ 50)                        |
| `MEGA50`     | 50% até R$ 80 de desconto (mínimo R$ 100) |
| `FIXO25`     | R$ 25 (mínimo R$ 25)                      |
| `FIXO500`    | R$ 500                                    |
| `DESCONTO5`  | R$ 5                                      |
| `VERAO2024`  | expirado                                  |
| `DESATIVADO` | inativo                                   |
