import { fail, handle, ok, readJson } from '@/lib/api';
import { placeOrder } from '@/services/checkout-service';

export const dynamic = 'force-dynamic';

interface Body {
  cartId?: string;
  cep?: string;
  couponCode?: string | null;
  customer?: { name?: string; email?: string };
}

export async function POST(req: Request) {
  const body = await readJson<Body>(req);

  if (typeof body?.cartId !== 'string' || typeof body.cep !== 'string') {
    return fail('VALIDATION_ERROR', 'Informe cartId e cep.', 400);
  }

  return handle(() => {
    const order = placeOrder({
      cartId: body.cartId!,
      cep: body.cep!,
      couponCode: body.couponCode,
      name: body.customer?.name,
      email: body.customer?.email,
    });
    return ok({ order }, 201);
  });
}
