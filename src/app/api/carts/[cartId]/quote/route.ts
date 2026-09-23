import { fail, handle, ok, readJson } from '@/lib/api';
import { quoteCart } from '@/services/checkout-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ cartId: string }> }) {
  const { cartId } = await params;
  const body = await readJson<{ cep?: string; couponCode?: string | null }>(req);

  if (typeof body?.cep !== 'string') {
    return fail('VALIDATION_ERROR', 'Informe o CEP.', 400);
  }

  return handle(() => ok({ quote: quoteCart(cartId, body.cep!, body.couponCode) }));
}
