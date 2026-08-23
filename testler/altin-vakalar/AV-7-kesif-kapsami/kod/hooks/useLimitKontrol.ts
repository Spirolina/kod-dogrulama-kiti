import { LIMITLER } from '../config/limits';

export function useLimitKontrol() {
  const { data: bugunToplam = 0 } = useQuery(['gunlukToplam'], transferApi.gunlukToplam);

  const kontrolEt = (tutar: number) => {
    if (bugunToplam + tutar > LIMITLER.gunlukTransfer) {
      return { izinVar: false, mesaj: 'Günlük limitiniz aşıldı.' };
    }
    return { izinVar: true };
  };

  return { kontrolEt };
}
