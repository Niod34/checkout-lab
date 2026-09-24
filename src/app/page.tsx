import Link from 'next/link';
import { listProducts } from '@/db';
import { formatBRL } from '@/lib/money';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductThumb } from '@/components/ProductThumb';

export const dynamic = 'force-dynamic';

export default function CatalogPage() {
  const products = listProducts();

  return (
    <>
      <h1>Produtos</h1>
      <div className="grid" data-testid="product-grid">
        {products.map((product) => (
          <article
            key={product.id}
            className="card product-card"
            data-testid={`product-${product.slug}`}
          >
            <ProductThumb id={product.id} name={product.name} />
            <Link href={`/produto/${product.slug}`} className="name">
              {product.name}
            </Link>
            <p className="muted">{product.description}</p>
            <div className="price-row">
              <span className="price" data-testid="price">
                {formatBRL(product.priceCents)}
              </span>
              <span className={product.stock > 0 ? 'tag' : 'tag out'} data-testid="stock">
                {product.stock > 0 ? `${product.stock} em estoque` : 'Esgotado'}
              </span>
            </div>
            <AddToCartButton slug={product.slug} disabled={product.stock === 0} />
          </article>
        ))}
      </div>
    </>
  );
}
