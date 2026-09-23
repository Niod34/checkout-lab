import { toCents } from './money';
import type { ShippingRegion } from './types';

export const RULES = {
  FREE_SHIPPING_THRESHOLD_CENTS: toCents(200),
  BASE_SHIPPING_CENTS: toCents(19.9),
  HEAVY_SURCHARGE_CENTS: toCents(15),
  HEAVY_THRESHOLD_GRAMS: 10_000,
  MAX_QUANTITY_PER_ITEM: 10,
} as const;

export const REGION_SURCHARGE_CENTS: Record<ShippingRegion, number> = {
  SUDESTE: 0,
  SUL: toCents(8),
  CENTRO_OESTE: toCents(12),
  NORDESTE: toCents(18),
  NORTE: toCents(25),
};

// Faixas simplificadas pelos dois primeiros dígitos do CEP.
const REGION_RANGES: { region: ShippingRegion; from: number; to: number }[] = [
  { region: 'SUDESTE', from: 1, to: 39 },
  { region: 'NORDESTE', from: 40, to: 65 },
  { region: 'NORTE', from: 66, to: 69 },
  { region: 'CENTRO_OESTE', from: 70, to: 79 },
  { region: 'SUL', from: 80, to: 99 },
];

export function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

export function isValidCep(cep: string): boolean {
  return /^\d{8}$/.test(normalizeCep(cep));
}

export function regionForCep(cep: string): ShippingRegion | null {
  if (!isValidCep(cep)) return null;
  const prefix = Number(normalizeCep(cep).slice(0, 2));
  return REGION_RANGES.find((r) => prefix >= r.from && prefix <= r.to)?.region ?? null;
}
