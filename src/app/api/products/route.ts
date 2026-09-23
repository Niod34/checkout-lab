import { listProducts } from '@/db';
import { ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({ products: listProducts() });
}
