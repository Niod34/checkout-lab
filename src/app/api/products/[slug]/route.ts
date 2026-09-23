import { findProductBySlug } from '@/db';
import { fail, ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) {
    return fail('PRODUCT_NOT_FOUND', 'Produto não encontrado.', 404);
  }
  return ok({ product });
}
