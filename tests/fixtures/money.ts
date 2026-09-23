// O Intl usa espaço não separável depois do "R$", por isso a comparação é feita por regex.
export function brl(cents: number): RegExp {
  const value = (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  return new RegExp(`R\\$\\s${value.replace('.', '\\.')}`);
}
