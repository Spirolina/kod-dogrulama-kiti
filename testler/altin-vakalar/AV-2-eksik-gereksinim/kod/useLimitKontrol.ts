const GUNLUK_LIMIT = 50000;

export function useLimitKontrol(bugunToplam: number) {
  const kontrolEt = (tutar: number) => {
    if (bugunToplam + tutar > GUNLUK_LIMIT) {
      return { izinVar: false, mesaj: 'İşlem gerçekleştirilemedi.' };
    }
    return { izinVar: true };
  };

  return { kontrolEt };
}
