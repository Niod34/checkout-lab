import { percentOf, type Cents } from './money';
import { REGION_SURCHARGE_CENTS, RULES, regionForCep } from './rules';
import type { CartItem, Coupon, CouponRejection, Quote } from './types';

export function calculateSubtotal(items: CartItem[]): Cents {
  return items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
}

export function calculateWeight(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.weightGrams * item.quantity, 0);
}

export function validateCoupon(
  coupon: Coupon | null,
  subtotalCents: Cents,
  now: Date,
): CouponRejection | null {
  if (!coupon) {
    return { code: 'INVALID_COUPON', message: 'Cupom não encontrado.' };
  }
  if (!coupon.active) {
    return { code: 'INACTIVE_COUPON', message: 'Este cupom foi desativado.' };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return { code: 'EXPIRED_COUPON', message: 'Este cupom expirou.' };
  }
  if (subtotalCents < coupon.minSubtotalCents) {
    return { code: 'MIN_SUBTOTAL_NOT_MET', message: 'Subtotal abaixo do mínimo do cupom.' };
  }
  return null;
}

export function calculateDiscount(coupon: Coupon, subtotalCents: Cents): Cents {
  if (coupon.type === 'FIXED') {
    return Math.min(coupon.value, subtotalCents);
  }
  const discount = percentOf(subtotalCents, coupon.value);
  const capped = coupon.maxDiscountCents ?? discount;
  return Math.min(discount, capped, subtotalCents);
}

export function calculateShipping(amountCents: Cents, weightGrams: number, cep: string) {
  const region = regionForCep(cep);
  if (!region) {
    return { shippingCents: 0, freeShipping: false };
  }
  if (amountCents >= RULES.FREE_SHIPPING_THRESHOLD_CENTS) {
    return { shippingCents: 0, freeShipping: true };
  }
  const heavy = weightGrams > RULES.HEAVY_THRESHOLD_GRAMS ? RULES.HEAVY_SURCHARGE_CENTS : 0;
  return {
    shippingCents: RULES.BASE_SHIPPING_CENTS + REGION_SURCHARGE_CENTS[region] + heavy,
    freeShipping: false,
  };
}

interface QuoteInput {
  items: CartItem[];
  cep: string;
  couponCode?: string | null;
  coupon?: Coupon | null;
}

export function buildQuote({ items, cep, couponCode, coupon = null }: QuoteInput): Quote {
  const subtotalCents = calculateSubtotal(items);
  const totalWeightGrams = calculateWeight(items);

  let discountCents = 0;
  let appliedCoupon: string | null = null;
  let couponRejection: CouponRejection | null = null;

  if (couponCode) {
    couponRejection = validateCoupon(coupon, subtotalCents, new Date());
    if (!couponRejection && coupon) {
      discountCents = calculateDiscount(coupon, subtotalCents);
      appliedCoupon = coupon.code;
    }
  }

  // O frete grátis é avaliado sobre o valor já com desconto (ver BUG-001).
  const afterDiscount = subtotalCents - discountCents;
  const { shippingCents, freeShipping } = calculateShipping(afterDiscount, totalWeightGrams, cep);

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: afterDiscount + shippingCents,
    totalWeightGrams,
    appliedCoupon,
    couponRejection,
    freeShipping,
    shippingRegion: regionForCep(cep),
  };
}
