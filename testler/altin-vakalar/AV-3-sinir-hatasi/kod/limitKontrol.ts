export const GUNLUK_LIMIT = 50000;

export function izinVar(bugunToplam: number, yeniTutar: number): boolean {
  return bugunToplam + yeniTutar < GUNLUK_LIMIT;
}
