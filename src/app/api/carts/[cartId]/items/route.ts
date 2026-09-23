import { fail, handle, ok, readJson } from '@/lib/api';
import { addItem } from '@/services/cart-service';

export const dynamic = 'force-dynamic';

interface Body {
  productSlug?: string;
  productId?: number;
  quantity?: number;
}

export async function POST(req: Request, { params }: { params: Promise<{ cartId: string }> }) {
  const { cartId } = await params;
  const body = await readJson<Body>(req);

  if (!body || (!body.productSlug && body.productId === undefined)) {
    return fail('VALIDATION_ERROR', 'Informe productSlug ou productId.', 400);
  }

  return handle(() => {
    const cart = addItem(cartId, { ...body, quantity: body.quantity ?? 1 });
    return ok({ cart }, 201);
  });
}
