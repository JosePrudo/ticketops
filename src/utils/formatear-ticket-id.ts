export function formatearTicketId(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999999) throw new RangeError('El identificador debe estar entre 0 y 999999.');
  return `TKT-${String(n).padStart(6, '0')}`;
}
