import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findOrder } from '@/db';
import { formatBRL } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = findOrder(orderId);
  if (!order) notFound();

  const { quote } = order;

  return (
    <>
      <h1>Pedido confirmado</h1>
      <p className="alert success" data-testid="order-id">
        Pedido {order.id}
      </p>
      <p className="muted">
        {order.customer.name} &middot; {order.customer.email}
      </p>

      <table>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.productId}>
              <td>{item.name}</td>
              <td>{item.quantity}x</td>
              <td>{formatBRL(item.unitPriceCents * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals">
        <div className="row">
          <span>Desconto</span>
          <span data-testid="discount">- {formatBRL(quote.discountCents)}</span>
        </div>
        <div className="row">
          <span>Frete</span>
          <span data-testid="shipping">{formatBRL(quote.shippingCents)}</span>
        </div>
        <div className="row grand">
          <span>Total</span>
          <span data-testid="total">{formatBRL(quote.totalCents)}</span>
        </div>
      </div>

      <Link href="/">Voltar para a loja</Link>
    </>
  );
}
