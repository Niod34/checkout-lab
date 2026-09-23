import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findProductBySlug } from '@/db';
import { formatBRL } from '@/lib/money';
import { AddToCartButton } from '@/components/AddToCartButton';

export const dynamic = 'force-dynamic';

function formatKg(grams: number) {
  return `${(grams / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <Link href="/">&larr; Voltar</Link>
      <h1 data-testid="product-name">{product.name}</h1>
      <p className="muted">{product.description}</p>
      <p className="price" data-testid="product-price">
        {formatBRL(product.priceCents)}
      </p>
      <p className="muted" data-testid="product-weight">
        Peso: {formatKg(product.weightGrams)}
      </p>
      <AddToCartButton slug={product.slug} disabled={product.stock === 0} />
    </>
  );
}
