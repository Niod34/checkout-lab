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
    <div className="card order-card">
      <div className="check">✓</div>
      <h1>Pedido confirmado</h1>
      <p className="order-number" data-testid="order-id">
        Pedido {order.id} · {order.customer.name}
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
        <hr className="divider" />
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

      <Link href="/" className="button block">
        Continuar comprando
      </Link>
    </div>
  );
}
