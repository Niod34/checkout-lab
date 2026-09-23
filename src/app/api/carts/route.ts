import { createCart } from '@/db';
import { ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST() {
  return ok({ cart: createCart() }, 201);
}
