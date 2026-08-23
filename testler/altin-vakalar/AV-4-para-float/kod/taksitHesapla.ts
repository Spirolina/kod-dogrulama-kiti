export function taksitHesapla(anaTutar: number, adet: number) {
  const taksit = Number((anaTutar / adet).toFixed(2));
  const taksitler = Array(adet).fill(taksit);
  const toplam = taksitler.reduce((a, b) => a + b, 0);

  return { taksit, taksitler, toplam };
}
