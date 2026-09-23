import { fail, handle, ok, readJson } from '@/lib/api';
import { removeItem, updateItem } from '@/services/cart-service';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ cartId: string; productId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { cartId, productId } = await params;
  const body = await readJson<{ quantity?: number }>(req);

  if (typeof body?.quantity !== 'number') {
    return fail('VALIDATION_ERROR', 'Informe a quantidade.', 400);
  }

  return handle(() => ok({ cart: updateItem(cartId, Number(productId), body.quantity!) }));
}

export async function DELETE(_req: Request, { params }: Params) {
  const { cartId, productId } = await params;
  return handle(() => ok({ cart: removeItem(cartId, Number(productId)) }));
}
