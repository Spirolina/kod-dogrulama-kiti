# Altın Vakalar

Workflow'un kendi testi. Her vaka: bilerek konmuş bir tohum + sahte analiz + beklenen sonuç.
Hedef mimari: **her MFE ayrı WebView'da** çalışan React uygulamaları. Native kabuk kapsam dışı —
bulgular her zaman bizim kodumuzda olmalı.

**Ne zaman koşulur:** `sablonlar/lens-paketi.md` her değiştiğinde, agent tanımları
güncellendiğinde, yeni lens/kontrol maddesi eklendiğinde.

**Nasıl koşulur:**
1. Yeni Claude Code oturumu (`/clear`)
2. `/dv-dogrula` — analiz: vakanın `analiz.md`'si, kapsam: `kod/` klasörü
3. Çıktıyı `beklenen.md` ile karşılaştır

| Vaka | Test ettiği | Lens / bileşen |
|---|---|---|
| AV-1 | `➕` gereksinimsiz kod + PII analytics | `dv-iz-denetci`, L6 |
| AV-2 | `❌` eksik gereksinim | `dv-iz-denetci` |
| AV-3 | Sınır değeri (`<` vs `<=`) | L1 |
| AV-4 | JS float / `toFixed` + **köprü** + **analist paketi dili** + **KAPI 5.6 agent regresyonu** | L2, `GOREV:KOPRU`, `dv-analist-paketi` |
| AV-5 | Köprü fail-open + platform kontrolü yok | L14, L11, L5 |
| AV-6 | **Yanlış pozitif eleme** | `dv-curutucu` |
| AV-7 | **B modu kapsam keşfi** | `GOREV:KAPSAM` |
| AV-8 | Türkçe locale tuzağı | L10 |
| AV-9 | `key={i}` + stale closure + idempotent olmayan efekt | L13 |
| AV-10 | Oturum temelsiz varsayımla depodan okunuyor | L15, L6, L5 |
| AV-11 | Sıfırdan yüklemede çok adımlı akış baştan başlıyor | L15, L3, L16 |
| AV-12 | **Otomasyon yargısı karar dalları** | `GOREV:OTOMAT` (KAPI 5.7) |
| AV-13 | **Tekrar eleme + gruplama + hesap koşulu** | `dv-analist-paketi` (KAPI 5.6) |

**Kural:** lens paketine yeni kontrol maddesi eklendiğinde beraberinde bir altın vaka gelir.
Yoksa eklemenin işe yaradığı hiçbir zaman doğrulanmaz.

**AV-6 en değerlisi** — sistemin *yanlış alarm vermediğini* test eden tek vaka. Kod doğrudur;
bulgu üretilirse çürütülmesi beklenir. Ayakta kalırsa sistem yanlış pozitif üretiyor demektir.
AV-6 aynı zamanda tek **temiz koşum** vakası: köprüye hiçbir şey gitmez, dolayısıyla
KAPI 5.7'nin koşulsuz çalıştığını doğrulayan tek yer burasıdır. Paketin yapısal
parçalarının (gereksinim tablosu, koşum planı, üç parçalı beklenen sonuç) bulgu
olmadan da üretildiğini de burada doğruluyoruz — "yapacak iş yok" hissinin en güçlü
olduğu koşum bu.

**AV-12 farklı bir şeyi test ediyor** — diğerleri *bulmayı*, o *karar vermeyi*. Otomasyon
yargısının en tehlikeli hatası yanlış `HAYIR` değil, emin olmadığı yerde `EVET` demesi.

## Lens kapsama durumu

Kapsanan: L1 L2 L3 L5 L6 L10 L11 L13 L14 L15 L16
Kapsanmayan: **L4 L7 L8 L9 L12** — bunlar için vaka yok.
Pilot sırasında bu lenslerden bulgu gelmezse önce vaka yazıp lensi doğrula, sonra
"temiz" sonucuna güven.

**AV-13 üçüncü bir şeyi test ediyor** — *elemeyi*. Analistlerden gelen geri bildirimin
(tekrar senaryolar, gruplama, hesap koşulu, yüzeysel beklenen sonuç) karşılığı.

Eleme, diğerlerinden farklı bir biçimde başarısız olur: paket **kısalır ve tertemiz
görünür.** Kaybolan senaryonun yerinde boşluk kalmaz, hiçbir sağlık işareti kızarmaz.
Bu yüzden vaka iki mekanizmayı ayrı ayrı sınıyor:

- **§2e tekrar eleme** — köprü senaryosu ile gereksinimin kendi negatif senaryosu
  birleşmeli, ve birleşirken `(*)` hayatta kalmalı. İşaret düşerse yakalanan defect
  kaçan sayılır ve kitin tek metriği bozulur.
- **§2d akış varyantı** — dokuz gereksinim iki müşteri türü için tekrar yazılırsa 18
  senaryo çıkar. Bu tuzağı tekrar eleme **yakalayamaz**: iki varyantın hesap koşulu
  farklıdır, üçlü eşleşme tutmaz. Tek savunma kaynağındadır.

İkinci koşumu (başlıksız analiz) atlanmamalı: bölümleme kuralının ezberlenmiş bir
kategori listesine dönüşmediğini kanıtlayan tek yer orası.
