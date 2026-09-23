import type { Cents } from './money';

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: Cents;
  stock: number;
  weightGrams: number;
}

export type CouponType = 'PERCENT' | 'FIXED';

export interface Coupon {
  code: string;
  type: CouponType;
  /** PERCENT: percentual (10 = 10%). FIXED: valor em centavos. */
  value: number;
  minSubtotalCents: Cents;
  maxDiscountCents: Cents | null;
  expiresAt: string | null;
  active: boolean;
}

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  unitPriceCents: Cents;
  quantity: number;
  weightGrams: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export type CouponErrorCode =
  'INVALID_COUPON' | 'INACTIVE_COUPON' | 'EXPIRED_COUPON' | 'MIN_SUBTOTAL_NOT_MET';

export interface CouponRejection {
  code: CouponErrorCode;
  message: string;
}

export type ShippingRegion = 'SUDESTE' | 'SUL' | 'CENTRO_OESTE' | 'NORDESTE' | 'NORTE';

export interface Quote {
  subtotalCents: Cents;
  discountCents: Cents;
  shippingCents: Cents;
  totalCents: Cents;
  totalWeightGrams: number;
  appliedCoupon: string | null;
  couponRejection: CouponRejection | null;
  freeShipping: boolean;
  shippingRegion: ShippingRegion | null;
}

export interface Order {
  id: string;
  customer: { name: string; email: string; cep: string };
  items: CartItem[];
  quote: Quote;
  createdAt: string;
}
