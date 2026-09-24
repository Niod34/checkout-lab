// Os produtos não têm foto, então cada um ganha um bloco colorido com as iniciais.
const COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#ef4444',
  '#22c55e',
  '#64748b',
];

interface Props {
  id: number;
  name: string;
  large?: boolean;
}

export function ProductThumb({ id, name, large = false }: Props) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

  return (
    <div
      className={large ? 'thumb large' : 'thumb'}
      style={{ background: COLORS[(id - 1) % COLORS.length] }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
