import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <h1 data-testid="not-found">Página não encontrada</h1>
      <Link href="/">Voltar para a loja</Link>
    </>
  );
}
