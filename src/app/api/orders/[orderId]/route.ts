import { findOrder } from '@/db';
import { fail, ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = findOrder(orderId);
  if (!order) {
    return fail('ORDER_NOT_FOUND', 'Pedido não encontrado.', 404);
  }
  return ok({ order });
}
