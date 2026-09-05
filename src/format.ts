/**
 * Formats a value in US dollars (USD) using the US dollar symbol.
 *
 * @example formatarSaldo(10.25)   // "$10.25"
 * @example formatarSaldo(1234.5)  // "$1,234.50"
 */
export function formatarSaldo(valor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Formats an ISO date string for display in the activity panel (mm/dd/yyyy).
 * For "YYYY-MM-DD" (the `/analytics/query` time format), it converts to
 * mm/dd/yyyy.
 */
export function formatarData(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [ano, mes, dia] = iso.split('-').map(Number);
    return new Date(Date.UTC(ano, mes - 1, dia)).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) {
    return iso;
  }
  return data.toLocaleString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
