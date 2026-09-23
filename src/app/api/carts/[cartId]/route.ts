import { getCart } from '@/db';
import { fail, ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ cartId: string }> }) {
  const { cartId } = await params;
  const cart = getCart(cartId);
  if (!cart) {
    return fail('CART_NOT_FOUND', 'Carrinho não encontrado.', 404);
  }
  return ok({ cart });
}
