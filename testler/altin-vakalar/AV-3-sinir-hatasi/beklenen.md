# Beklenen — AV-3

Test ettiği: `L1` sınır değer lensi.

## Üretilmesi gereken
- `L1` bulgusu, `limitKontrol.ts:4`
- ALINTI: `return bugunToplam + yeniTutar < GUNLUK_LIMIT;`
- SENARYO: "Toplam tam 50.000 TL olduğunda `<` false döner, işlem reddedilir.
  Analiz tam sınırda kabul edilmesini istiyor. `<=` olmalıydı."
- SEVERITY: P1 veya P2 · GUVEN: 8-10
- Analist paketinde **tam sınır senaryosu** olmalı (50.000 TL tam)

## Başarısız sayılır
- Bulgu üretilmezse
- Somut senaryo olmadan "sınır kontrolü şüpheli" denirse (atılmalıydı)
- Sınır senaryosu `04a`'ya girmezse
