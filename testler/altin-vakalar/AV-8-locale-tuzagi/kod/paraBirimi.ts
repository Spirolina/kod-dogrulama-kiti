const DESTEKLENEN = ['TRY', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'TIY'];

export function destekleniyorMu(kod: string): boolean {
  return DESTEKLENEN.includes(kod.toUpperCase());
}

export function formatla(tutar: number, kod: string): string {
  return tutar.toLocaleString() + ' ' + kod.toUpperCase();
}
