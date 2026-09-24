import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card empty-state">
      <h1 data-testid="not-found">Página não encontrada</h1>
      <p>O endereço acessado não existe.</p>
      <Link href="/" className="button">
        Voltar para a loja
      </Link>
    </div>
  );
}
