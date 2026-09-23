import Link from 'next/link';
import { listProducts } from '@/db';
import { formatBRL } from '@/lib/money';
import { AddToCartButton } from '@/components/AddToCartButton';

export const dynamic = 'force-dynamic';

export default function CatalogPage() {
  const products = listProducts();

  return (
    <>
      <h1>Produtos</h1>
      <div className="grid" data-testid="product-grid">
        {products.map((product) => (
          <article key={product.id} className="card" data-testid={`product-${product.slug}`}>
            <Link href={`/produto/${product.slug}`}>
              <strong>{product.name}</strong>
            </Link>
            <p className="muted">{product.description}</p>
            <span className="price" data-testid="price">
              {formatBRL(product.priceCents)}
            </span>
            <span className="tag" data-testid="stock">
              {product.stock > 0 ? `${product.stock} em estoque` : 'Esgotado'}
            </span>
            <AddToCartButton slug={product.slug} disabled={product.stock === 0} />
          </article>
        ))}
      </div>
    </>
  );
}
