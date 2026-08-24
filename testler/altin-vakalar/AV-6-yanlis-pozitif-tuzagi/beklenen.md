# Beklenen — AV-6

Test ettiği: **`dv-curutucu`**. Sistemin *yanlış alarm vermediğini* doğrular.

Bu vakada kod **doğrudur.** Tutar kuruş cinsinden tam sayı olarak geliyor, `Math.floor` ile
bölünüyor, kalan son taksite ekleniyor. Toplam her zaman ana tutara tam eşit. Float
aritmetiğine hiç girilmiyor.

## Beklenen akış
1. `dv-celiskici` (L2) muhtemelen bir bulgu **üretir** — normaldir, kusur değildir.
   Tipik: "bölme yuvarlaması kuruş kaybettirebilir" veya "JS'te sayı float64".
2. `dv-curutucu` bu bulguyu **çürütmek zorundadır.**
   Çürütme türü: `Etkisiz` veya `Yanlış okuma`
   Kanıt: `taksitler.push(anaTutarKurus - dagitilan);` — `taksitHesapla.ts:7`
   ve `Math.floor` + tam sayı kuruş girdisi
3. `ic/bulgular-curutulmus.md` içinde bulgu **ÇÜRÜTÜLENLER** tablosunda olmalı.

## Başarısız sayılır
- Bulgu ayakta kalırsa → sistem yanlış alarm üretiyor, güven ölür
- Bulgu köprüye giderse → analistin zamanı boşa harcanır
- Çürütme gerekçesiz yapılırsa (sessiz eleme yasağı)
- `dv-celiskici` hiç bulgu üretmezse → bu vakadan sinyal alınamaz, tarama gevşek demektir

## Neden en değerli vaka
Yanlış pozitif, kaçan bug'dan daha hızlı öldürür. Üç kere boşuna alarma koşan developer
dördüncü gerçek alarma bakmaz.

---

## KAPI 5.6 temiz koşumda koştu mu  (v0.8.0 — KRİTİK)

Bu vakanın tanımı gereği köprüye hiçbir bulgu gitmiyor: bulgu çürütülüyor, güven < 7
kalan bir şey yok. Dolayısıyla **KAPI 5.5 atlanıyor** ve `SONUC.md`'ye `Köprüye giden: 0`
yazılıyor.

KAPI 5.6 atlanmamalı.

Kontrol:
1. `ic/otomasyon-yargisi.md` **var mı** — koşulsuz üretilmesi gerekiyor
2. Sağlık işaretlerinde `GOREV: OTOMAT` bloğu var mı
3. `YARGILANAN` senaryo sayısına eşit mi
4. `SONUC.md` §4'te "Otomatikleşebilirlik" alt bölümü dolu mu

**Başarısız sayılır:** `ic/otomasyon-yargisi.md` yoksa.

**Neden bu vaka:** KAPI 5.6, 5.5'e katlanırsa ya da koşullu yazılırsa, en sağlıklı
değişikliklerde sessizce hiç koşmaz. Hata vermez, uyarı vermez — dosya sadece yok olur.
Test yok + hata yönetimi yok + kullanıcı görmüyor: tanım gereği kritik gap. Bu paketteki
tek "temiz koşum" vakası burası, kontrolün doğal yeri burası.
