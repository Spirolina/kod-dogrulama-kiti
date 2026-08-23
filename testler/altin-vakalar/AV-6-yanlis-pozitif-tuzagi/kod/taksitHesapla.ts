// Tüm hesap kuruş (tam sayı) üzerinden yapılır; float aritmetiğine hiç girilmez.
export function taksitHesapla(anaTutarKurus: number, adet: number) {
  const taban = Math.floor(anaTutarKurus / adet);
  const taksitler = Array(adet - 1).fill(taban);

  const dagitilan = taban * (adet - 1);
  taksitler.push(anaTutarKurus - dagitilan);

  return taksitler;
}
