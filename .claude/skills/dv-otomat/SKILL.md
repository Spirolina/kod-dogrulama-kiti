---
name: dv-otomat
description: Otomasyon üreticisi. Doğrulamanın otomasyon yargısından Playwright testleri üretir. Gerçek ortamda koşar, veri mock'u kullanmaz, hata yollarını arıza enjeksiyonuyla üretir. Görmediği seçiciyi uydurmaz. Testleri yazar, koşmaz. YENİ bir task'ta, ayrı bir branch'te koşulmalıdır.
---

# /dv-otomat — Otomasyon Üretimi (Faz B)

`/dv-dogrula` bitmiş bir değişiklikten Playwright testleri üretirsin.

Girdin `ic/otomasyon-yargisi.md`. Hangi senaryonun otomatikleşeceğine **sen karar
vermiyorsun** — karar KAPI 5.6'da verildi, sen uyguluyorsun.

Sözleşme: `sablonlar/otomasyon-sozlesmesi.md`. Bağlayıcıdır, hafızandan çalışma, oku.

## Neden ayrı task, ayrı branch

`/dv-dogrula` içinde test yazmak yasak ve bu doğru: bulguyu bulan bağlam testi yazarsa
test bulgunun etrafından dolaşır. `dv-curutucu`'nun bulguyu üretenden ayrı olmasıyla
aynı gerekçe.

Bu skill `/dv-dogrula` ile **aynı task'ta koşturulmaz.**

## Ürün koduna dokunma yasağı

Test yazarsın — ürün kodu değiştirmezsin. Bulgu görsen bile düzeltmezsin; testi yeşile
çevirmek için kaynak dosyaya dokunmazsın. Test kırmızıysa bu bir sonuçtur, gizlenecek
bir şey değil.

Bitirmeden önce:

```bash
git status --porcelain | awk '{print $NF}' | grep -vE '^(playwright|otomasyon-testleri|auth|dogrulama)/|^(playwright\.config|ortam-profili\.local|\.gitignore|\.env\.example)'
```

Bir satır bile dönerse **dur ve bildir.**

---

## KAPI 0 — Ortam ve girdi

**Ortamı belirle.** Task tabanlıysa (plan → onay → çalıştır) KAPI 2 plan aşamasına
taşınır. Emin değilsen task varsay.

Gerekenler:

| Girdi | Nereden | Yoksa |
|---|---|---|
| `ic/otomasyon-yargisi.md` | doğrulama klasörü | **DUR.** Önce `/dv-dogrula` koşulmalı |
| `ic/analist-girdisi.md` | doğrulama klasörü | DUR — senaryo metinleri orada |
| `ic/rtm.md` | doğrulama klasörü | Devam et, `R-xx` bağı zayıflar, bildir |
| Ortam + auth bilgisi | **task notu** ya da `ortam-profili.local.json` | KAPI 2'ye bak |
| `sablonlar/otomasyon-sozlesmesi.md` | repo | DUR |

`ic/otomasyon-yargisi.md` içinde `EVET` ve `EVET-ARIZA` yoksa iş yok: bunu söyle ve
bitir. Sıfır test üretmek bir başarısızlık değil, doğru cevap olabilir.

---

## KAPI 1 — Araç tespiti (BLOKLAYICI)

```bash
grep -oE '"@playwright/test": *"[^"]*"' package.json
```

Yoksa **dur.** Rapor et:

> Bu repoda Playwright yok. Kurulum kararı senin — `npm i -D @playwright/test`.
> Kurulduktan sonra bu task'ı yeniden aç.

**Yeni bağımlılık önerme, kurma, `package.json`'a yazma.** Kit sıfır bağımlılık sözü
verdi; tek satır `npm i` onu bozar.

Test dizinini belirle:

- `playwright.config.*` varsa → içindeki `testDir`
- Yoksa → `otomasyon-testleri/`

**Var olan test dosyalarının üzerine yazma.** Aynı adlı dosya varsa KAPI 5'e bak.

---

## KAPI 2 — Ortam profili

Kaynak öncelik sırası:

```
1. Task notu           ← varsa KAZANIR (açıkça yazılmış, en güncel)
2. ortam-profili.local.json   ← varsa taban
3. Repodan çıkarım     ← package.json scripts, dev server config, kod
```

**Task notunu profile yaz.** Developer notu her koşumda yeniden yazmak zorunda kalmasın;
bir kez yazsın, profil kalıcı olsun. Profil zaten varsa ve not onunla çelişiyorsa **not
kazanır** — farkı raporla, sessizce üzerine yazma.

Profil şeması: `sablonlar/otomasyon-sozlesmesi.md` §2. Doldurulamayan her alan
`<DOLDUR: ...>` olarak bırakılır ve raporda listelenir.

Repodan çıkarabildiklerin:

| Alan | Nereden |
|---|---|
| `container.komut`, `child.komut` | `package.json` scripts |
| `container.url`, `child.url` | dev server config (vite/webpack/next), varsayılan portlar |
| `auth.kullanim` | token'ı `Authorization` header'ına koyan ya da depoya yazan satır |
| `saglik_kontrolu` | en ucuz "ayakta mı" kontrolü — kök sayfa 200 dönüyor mu yeter |

**Çıkarım her zaman kanıta bağlı.** Bir alanı `path:line` göstererek dolduramıyorsan
doldurma, `<DOLDUR>` bırak. Tahminle dolu bir profil, boş profilden kötüdür: developer
onu okur, doğru sanır, koşum sebebi anlaşılmayan bir hatayla düşer.

Task tabanlı ortamda profil taslağını **plan aşamasında göster** ve onay al. Onaydan
sonra dosyaya yaz.

`.gitignore` kontrolü — üçü de olmalı, yoksa ekle:

```
ortam-profili.local.json
.env.local
auth/
```

Ayrıca `.env.example` üret: gereken değişken adları, **değersiz.**

---

## KAPI 3 — Auth iskeleti

`sablonlar/otomasyon-sozlesmesi.md` §2b ve §2c bağlayıcı.

**Biçim A (`yontem: api`)** — tercih edilen. Setup projesi login endpoint'ini çağırır,
token'ı `kullanim` alanına göre oturuma yazar, `auth/<hesap-anahtari>.json` olarak
kaydeder. **Arayüz hiç açılmaz.**

**Biçim B (`yontem: form`)** — setup projesi login formunu doldurur.

Her hesap için ayrı storage state. Tek global oturum **yok** — "test başına bir hesap"
kuralı bunu gerektiriyor.

`auth.gecerlilik_dk` doluysa setup süresi dolmuş state'i tazeler.

**`auth.ek_adim` `OTP` ise dur ve sor.** Test hesapları için atlanamıyorsa otomasyon
kurulamaz; on beşinci testte keşfetmektense şimdi söyle.

`auth` bloğu hiç yoksa ve login akışı kapsamda da bulunamıyorsa:

```
AUTH: BULUNAMADI
```

Test üretimine **devam et** ama setup dosyasını şablon olarak bırak, testleri
`test.fixme` ile işaretle ve raporda ilk sıraya yaz.

---

## KAPI 4 — Test üretimi

`ic/otomasyon-yargisi.md` içindeki her `EVET` ve `EVET-ARIZA` satırı için
`dv-otomat-yazar` agent'ını **senaryo başına ayrı ayrı** çağır.

Her çağrıya ver:
- Senaryonun tam metni (`ic/analist-girdisi.md`'den: ön koşul, adımlar, beklenen sonuç)
- Yargı satırı (`Otomat` değeri, gerekli hesap, gerekçe)
- Bağlı gereksinim metni (`ic/rtm.md` ya da `ic/gereksinimler.md`)
- Kapsamdaki dosya listesi
- `sablonlar/otomasyon-sozlesmesi.md` yolu

`TUR-2`, `HAYIR-*` ve `BELİRSİZ` satırları için **test üretme.** Raporda neden
üretilmediğini yaz.

### SIRALI MOD — alt agent yoksa

Zincir durmaz ama:

1. `sablonlar/otomasyon-sozlesmesi.md`'yi **her senaryo öncesi yeniden oku.**
2. Senaryoları **tek tek** işle. İki senaryoyu aynı geçişte yazma — birleşen geçiş,
   ikisinde de seçici uydurma eğilimini artırır.
3. Her dosyayı yazdıktan sonra seçici kanıtlarını kontrol et, sonra diğerine geç.
4. Raporda `Bağımsızlık: ZAYIF — sıralı modda üretildi` yaz.

---

## KAPI 5 — Kendi kontrolün (BLOKLAYICI)

Üretilen her dosya için sırayla:

**1. Uydurulmuş seçici var mı**

Agent'ın her seçici için verdiği `path:line` kanıtını doğrula. Kanıtsız seçici varsa
o satırı `<SECICI-BULUNAMADI: ...>` ile değiştir ve testi `test.fixme` yap.

Sağlık işareti: `KANITSIZ_SECICI: <n>` — **0 olmalı.**

**2. Ürün koduna dokunuldu mu**

KAPI'ların başındaki `git status` kontrolünü koş.

**3. Var olan test üzerine yazıldı mı**

Üretilen her dosya başlığında şu satır olmalı:

```javascript
// ÜRETİLDİ — MT-03 · <tarih> · elle düzenlersen bu satırı sil
```

Aynı adlı bir dosya zaten varsa:
- Başlıkta `ÜRETİLDİ` satırı **varsa** → üzerine yaz, normaldir
- **Yoksa** → elle düzenlenmiş. **Dokunma.** Yeni dosyayı `.yeni` uzantısıyla yaz ve
  raporda çakışmayı bildir.

**4. Arıza enjeksiyonu kuralları**

`EVET-ARIZA` testlerinde:
- Route handler tek URL desenine ve tek teste bağlı mı
- Başarılı yanıt uydurulmuş mu (**yasak** — 200 içinde iş değeri)
- Aynı testte hem enjeksiyon hem iş değeri assert'i var mı (**yasak**)

Sağlık işareti: `KURAL_IHLALI: <n>` — **0 olmalı.**

**5. Bağımlılık eklendi mi**

```bash
git diff --stat package.json package-lock.json
```

Boş dönmeli.

---

## KAPI 6 — Rapor

`dogrulama/<tarih>-<konu>/OTOMASYON.md` yaz:

```markdown
# Otomasyon Üretimi — <konu>

**Durum: <ÜRETİLDİ | EKSİK ÜRETİLDİ | ÜRETİLEMEDİ>**
Test dosyaları henüz **koşulmadı** — doğrulanmadılar.

## Ne yapmalısın
1. `.env.local` doldur: <gereken değişkenler>
2. `ortam-profili.local.json` içindeki <n> adet `<DOLDUR>` alanını tamamla
3. `npx playwright test` — ilk koşum
4. Kırmızıları §5'teki triyajla ayır

## 1. Üretilenler
| Test | Bağlı gereksinim | Dosya | Tür |
|---|---|---|---|
| MT-01 | R-01 | <yol> | gerçek koşum |
| MT-04 | R-03 | <yol> | arıza enjeksiyonlu |

## 2. Üretilmeyenler ve nedeni
| Test | Yargı | Neden |
|---|---|---|
| MT-06 | HAYIR-CIHAZ | cihaz durumu — kalıcı manuel |
| MT-07 | TUR-2 | (*) analist kararı bekliyor |
| MT-09 | BELİRSİZ | yargı karar verememiş |

## 3. Senin dolduracakların
| Ne | Nerede | Neden ben dolduramadım |
|---|---|---|

## 4. Gereken test hesapları
| Anahtar | Hangi testler | Hangi durumda olmalı |
|---|---|---|

## 5. İlk koşum triyajı
Bu testler hiç koşmadı. İlk koşumda kırmızı beklenir; sebebi genelde kod değil:

| Belirti | Muhtemel sebep | Ne yap |
|---|---|---|
| Hepsi login'de düşüyor | auth bloğu eksik/yanlış | Profildeki `auth`'u kontrol et |
| Tek test elementi bulamıyor | seçici kaymış | O satırı düzelt, `ÜRETİLDİ` satırını sil |
| "hesap yok" ile atlanıyor | `.env.local` eksik | Değişkenleri tanımla |
| Ortam kontrolü geçmiyor | app'ler ayakta değil | Komutları/portları kontrol et |
| Yukarıdakilerin hiçbiri | **gerçek bulgu** | `kacan-defectler.md`'ye aday |

## 6. Sağlık işaretleri
KANITSIZ_SECICI: 0
KURAL_IHLALI: 0
URUN_KODU_DEGISTI: hayır
YENI_BAGIMLILIK: hayır
URETILEN_TEST: <n>
DOLDURULACAK_ALAN: <n>
Bağımsızlık: <NORMAL | ZAYIF>
```

---

## KAPI 7 — Devir

```
OTOMASYON ÜRETİLDİ · 8 test · 3 arıza enjeksiyonlu · 4 senaryo üretilmedi

Kanıtsız seçici    0
Ürün kodu          değişmedi
Yeni bağımlılık    yok
Doldurulacak       2 alan + .env.local

Sırada:
1. .env.local doldur (TEST_USER_1, TEST_PW_1)
2. ortam-profili.local.json: auth.gecerlilik_dk, saglik_kontrolu.child
3. npx playwright test
4. Kırmızıları OTOMASYON.md §5 ile ayır — çoğu kod değil ortam
```

**Testleri koşmaya çalışma.** Task ortamında container ve child app ayakta değil;
beklemek boşuna. Koşum developer'ın adımı.

---

## Bu skill'in yasakları

1. **Yargıyı değiştirme.** `HAYIR-*` yazan senaryoya test yazma, `BELİRSİZ`'i kendi
   kararınla `EVET`'e çevirme. Karar KAPI 5.6'da verildi.
2. **Senaryoyu değiştirme.** Otomatikleşsin diye adım ekleme/çıkarma. Senaryo neyse odur.
3. **Beklenen değeri koddan alma.** Analizden gelir. Koddan alınan beklenti, kodun
   kendini onaylamasıdır.
4. **Görmediğin seçiciyi yazma.** Kanıtsız seçici, birinci gün kırmızı yanan ve sebebi
   teşhis edilemeyen test demektir.
5. **Veri mock'u kurma.** Backend gerçekten konuşur. Tek istisna arıza enjeksiyonu
   (§4d) ve orada da başarılı yanıt uydurulmaz.
6. **Ürün kodunu değiştirme.** Testi yeşile çevirmek için bile.
7. **Bağımlılık ekleme.**
8. **Elle düzenlenmiş testin üzerine yazma.** `ÜRETİLDİ` satırı yoksa dokunma.
