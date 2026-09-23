// Valores monetários são sempre inteiros em centavos, para evitar erro de ponto flutuante.
export type Cents = number;

export function toCents(reais: number): Cents {
  return Math.round(reais * 100);
}

export function percentOf(cents: Cents, percent: number): Cents {
  return Math.round((cents * percent) / 100);
}

export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
