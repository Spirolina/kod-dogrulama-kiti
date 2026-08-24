# Senaryo Otomasyonu — Tasarım

TODOS.md #1'in açılmış hali. Soru: `ANALISTE-GIDECEK.md` içindeki manuel test
senaryoları çalıştırılabilir teste dönüşebilir mi?

Kısa cevap: **evet, ama o dosyadan değil.** Ve hepsi değil. Ve bu turda üretici
yazılmıyor — bu turda otomasyonun dayanacağı **yargı katmanı** kuruluyor.

Durum: **FAZ A UYGULANDI (v0.8.0)** · `/plan-eng-review` geçti · 6 karar · 4 bulgu · 1 kritik gap
Bloke: **kalktı** (2026-08-24) — MFE lokalde açılıyor · Playwright kullanılabilir ·
mock yok, gerçek ortam · hesapları developer sağlar

---

## 1. Neden `ANALISTE-GIDECEK.md`'den üretilemez

Bu dosya, kodu **hiç görmemiş** bir bağlamda üretiliyor — sağlık işareti
`OKUNAN_KOD_DOSYASI: 0`. Bu bir kaza değil, v0.6.0'daki yapısal düzeltmenin ta kendisi:
görmediğini sızdıramaz.

Sonuç: dosyada seçici yok, rota yok, test id yok. Sadece iş dili var.

```
"Kalan limitiniz 5.000 TL olarak görünür"
        │
        └──> hangi ekranda? hangi elemanda? hangi state'te?
             Bu bilgi bu dosyada YOK ve olmamalı.
```

Otomasyon üretmek için hem senaryoya hem koda bakan bir bağlam gerekir. O bağlam
zaten var — bir alt katmanda:

```
analiz.md ──┐
            ├──> ic/rtm.md              R-xx <-> path:line eşlemesi   ← KOD BİLGİSİ
            ├──> ic/analist-girdisi.md  MT-xx senaryoları, R-xx'e bağlı
            ├──> ic/otomasyon-yargisi.md  ← YENİ. Yargı burada yaşar.
            │
            └──> ANALISTE-GIDECEK.md    sterilize, Confluence'a giden
                                        ← OTOMASYON BUNU KULLANMAZ, hiç okumaz
```

---

## 2. Beklenmedik iyi haber: senaryolar zaten otomasyona uygun yazılıyor

`sablonlar/analist-test-paketi.md` §2'deki iki kural analistler için yazılmıştı:

> - **Beklenen sonuç ekranda görünür olmalı.** "Limit düşürülür" bir iç durumdur,
>   analist göremez. "Kalan limitiniz 5.000 TL olarak görünür" görülebilir.
> - **Test verisi somut.** "Limiti dolu müşteri" değil, "Günlük limiti 50.000 TL
>   olan, o gün 45.000 TL göndermiş müşteri".

Bu iki kural senaryoyu tesadüfen **makine tarafından koşulabilir** hale getiriyor:

```
Analist için yazılmış                 Playwright karşılığı
─────────────────────────             ──────────────────────────────────────────
"Günlük limiti 50.000 TL olan,        hesap gereksinimi:
 o gün 45.000 TL göndermiş müşteri"     limit-50k-kullanilan-45k
                                        (test ister, developer sağlar)

"Menüden Limit Artırımı'na dokunur"   await page.getByRole('link',
                                        { name: 'Limit Artırımı' }).click()

"Tutar alanına 10.000 yazar"          await page.getByLabel('Tutar').fill('10000')

"Kalan limitiniz 5.000 TL olarak      await expect(page.getByText(
 görünür"                               'Kalan limitiniz 5.000 TL')).toBeVisible()
```

Görünür sonuç şartı = assert edilebilir sonuç şartı. Kit bunu bilmeden zorluyordu.

**Sonuç:** "beklenen sonuç ekranda görünür olmalı" kuralı gevşetilmez. Sadece analist
için değil, otomasyonun da tek dayanağı.

---

## 3. Asıl değer: oracle farkı

Kodlama akışında zaten unit test yazılıyor. O halde bu ne ekliyor?

```
                    Bu testi ne YAZDI?          Doğru cevabı nereden ALDI?
                    ────────────────────        ──────────────────────────
Unit test           Kodu yazan aynı agent       KODDAN
(kodlama akışı)                                 "kod bunu yapıyor, teyit et"

Senaryo testi       Bağımsız bağlam             ANALİZDEN
(bu öneri)                                      "analiz bunu istemişti, oldu mu"
```

Unit test kodun **ne yaptığını** sabitler. Senaryo testi analizin **ne istediğini**
sabitler. İkisi ayrıştığında hata oradadır — ve o ayrışmayı şu an sadece analist
yakalıyor, sürümde bir kez.

Tek şart: beklenen değer **analizden** alınacak, koddan değil. Koddan alınırsa test
totolojiye döner — kodun kendini onaylaması.

---

## 4. Nerede koşacak

Karar: **Playwright, gerçek ortamda, mock'suz.** Container app ve test edilecek child app
lokalde ayağa kaldırılır; senaryo gerçek kullanıcı gibi koşar.

```
  LOKAL KOŞUM                                  PRODÜKSİYON
  ─────────────                                ────────────
  ┌──────────────────────────┐                 ┌───────────────────────┐
  │ container app  :PORT_C   │                 │  NATIVE KABUK         │
  │   ┌────────────────────┐ │                 │   ┌─────────────────┐ │
  │   │ child app :PORT_X  │ │   ~karşılık~    │   │ WebView / MFE   │ │
  │   └────────────────────┘ │                 │   └─────────────────┘ │
  └──────────────────────────┘                 └───────────────────────┘
        ▲                                             ▲
        │ Playwright sürüyor                          │ insan sürüyor
        │ gerçek auth, gerçek backend                 │
```

`playwright.config.ts` iki `webServer` girdisiyle ikisini de kaldırır. Portlar ve auth
ortam profilinden gelir (§4b).

**Neden diğer ikisi değil:**

| Seçenek | Neden değil |
|---|---|
| RTL / jsdom | Senaryoyu bölmek zorunda: *"Menüden Limit Artırımı'na dokunun"* adımını koşamaz. Bölünen senaryo artık o senaryo değil — `R-xx ↔ MT-xx` izlenebilirlik zinciri kopar. Kitin tamamı o zincire dayanıyor |
| Appium / Maestro | Native kabuk başka ekibin; cihaz farmı + onların sürümü. Kapsam dışı |

**Neyi kapsıyor:** container → child geçişi, gerçek render, gerçek CSS ve odak, gerçek
auth, gerçek backend yanıtı. `AV-10 oturum devri` ve `AV-11 WebView öldürülmesi` türü
vakalar burada gerçekten sınanabiliyor — jsdom'da hiç sınanamazdı.

**Neyi kapsamıyor, dürüstçe:**

| Kapsanmayan | Neden | Ne olacak |
|---|---|---|
| Cihaz durumu (kilit, arka plan, donanım geri tuşu) | Tarayıcıda karşılığı yok | **Elle**, `HAYIR-CIHAZ` |
| Biyometri, push, kamera | Platform API | **Elle**, `HAYIR-CIHAZ` |
| Native köprünün kendi davranışı | Kabuk yok; container app onun yerine geçiyor | **Elle** |
| Zamana bağlı durum (*"gün sonu"*, *"3 gün sonra"*) | Ortam saatini oynatmak mock'a en yakın şey | **Elle**, `HAYIR-VERI` |

Hata yolları **kapsanıyor** — arıza enjeksiyonuyla (§4d).

### 4b. Ortam ve hesap sözleşmesi

Mock olmayınca senaryonun ön koşulu **gerçekten var olmak** zorunda. Çözüm: test ne
istediğini beyan eder, developer sağlar.

```
  ic/otomasyon-yargisi.md                  ortam-profili.local.json
  ────────────────────────                 ────────────────────────  (GITIGNORE)
  MT-03 gerekli hesap:                     {
    limit-50k-kullanilan-45k        ────>    "limit-50k-kullanilan-45k": {
                                               "kullanici": "$ENV:TEST_USER_3",
  MT-07 gerekli hesap:                         "parola":    "$ENV:TEST_PW_3"
    taksitli-kredi-aktif            ────>    },
                                             ...
                                           }
```

Kurallar:

1. **Gereksinim iş dilinde beyan edilir**, senaryonun *"Ön koşul / Veri"* kolonundan
   türetilir. O kolon zaten var — analist paketi şablonu §5'te.
2. **Hesap yoksa test SKIP, FAIL değil.** Sebep açıkça yazılır:
   `SKIP MT-03 — 'limit-50k-kullanilan-45k' hesabı profilde yok`.
   Eksik veri bir bulgu değildir; kırmızı yakarsa suite yalancı çoban olur ve
   `AV-6`'nın kuralı işler: *üç kere boşuna alarma koşan developer dördüncü gerçek
   alarma bakmaz.* Koşum özeti geçti / kaldı / **atlandı**'yı ayrı sayar.
3. **Test başına bir hesap.** Testler birbirinin durumunu tüketmez; MT-03 limiti
   harcarsa MT-04 etkilenmez.
4. **Koşum sonunda tüketim raporu.** Hangi hesapların durumu değişti, hangileri
   tazelenmeli — developer bir sonraki koşumdan önce bilsin.
5. **Kimlik bilgisi repoya girmez.** Profil dosyası `.gitignore`'da, değerler ortam
   değişkeninden. Kit şablonu yalnız *hangi anahtarlar gerekli* der.

### 4c. Kırmızı test, bulgu demek değildir

Gerçek ortamda kırmızının üç sebebi olabilir: bizim kodumuz, backend, ya da veri kayması.
Ayırmadan raporlamak yanlış pozitifle aynı şey.

```
KIRMIZI
   │
   ├─ ortam sağlık kontrolü geçti mi?  ──── HAYIR ──> ORTAM. Bulgu değil.
   │                                                  Tekrar koş, düzelmezse bildir.
   ├─ gerekli hesap profilde var mı?   ──── HAYIR ──> ATLANDI. Bulgu değil.
   │
   └─ ikisi de tamam                   ─────────────> BULGU. Rapora girer.
```

Suite ilk iş olarak bir sağlık kontrolü koşar (container ayakta mı, child ayakta mı,
login oluyor mu). Geçmezse senaryolara hiç başlamaz — 15 kırmızı yerine tek net mesaj.

### 4d. Arıza enjeksiyonu — hata yolları için tek istisna

Chrome DevTools'ta bir isteği engellemek ya da yavaşlatmak neyse, Playwright'ta
`page.route` odur. Bu **veri mock'u değil**: backend gerçekten konuşuyor, sadece tek bir
istek, tek bir testte bozuluyor.

```
VERİ MOCK'U  (yapılmıyor)               ARIZA ENJEKSİYONU  (yapılıyor)
──────────────────────────              ────────────────────────────────────
Backend hiç konuşmuyor                  Backend gerçekten konuşuyor
Tüm yanıtlar uydurma                    Tek istek, tek testte bozuluyor
Happy path kurgu                        Happy path gerçek, dokunulmuyor
Beklenen değeri sen yazıyorsun          Beklenen değer gerçek sistemden
```

**Ayıran kural:** arıza enjeksiyonu gerçek bir isteği **bozabilir**, başarılı bir yanıt
**uyduramaz.**

| İzin verilen | Yasak |
|---|---|
| İsteği engelle / kes | 200 içinde iş değeri uydurmak (bakiye, limit, taksit) |
| Yavaşlat, zaman aşımına düşür | Backend'i hiç ayağa kaldırmadan koşmak |
| Hata statüsü döndür (401, 500, 503) | Happy path'i enjeksiyonla geçmek |
| Bağlantıyı kes (offline) | Kalıcı, testler arası paylaşılan route handler |
| Bozuk/kesik gövde döndür — *yalnız senaryonun konusu buysa* | Aynı testte hem enjeksiyon hem iş değeri assert'i |

Son satır kritik: bozuk gövde uydurmak yalnız senaryo *"servis bozuk veri dönerse ne
olur"* olduğunda serbest. Orada assert edilen şey iş değeri değil, **savunma davranışı** —
çökmüyor mu, anlaşılır hata gösteriyor mu. İş değeri assert'i o testte olmaz.

**Analist dilinden karşılığı:**

| Senaryo | Playwright |
|---|---|
| "İnternet bağlantısı yokken" | `context.setOffline(true)` |
| "Sistem yanıt vermezse" | `page.route(url, r => r.abort('failed'))` |
| "İşlem çok uzun sürerse" | `page.route(url, async r => { await bekle(30_000); r.continue() })` |
| "Sunucu hata dönerse" | `r.fulfill({ status: 500 })` |
| "Oturumunuz sonlandıysa" | `r.fulfill({ status: 401 })` |
| "Servis eksik veri dönerse" | `r.fulfill({ status: 200, body: <kesik> })` |

**Kapsam kuralları:**

1. Enjeksiyon **tek URL desenine ve tek teste** bağlanır. Global route handler yasak —
   sessizce diğer testlere sızar ve neyin gerçek koştuğunu kimse bilemez.
2. Enjeksiyonlu test bunu **beyan eder**. Koşum raporu ikisini ayrı sayar:
   `12 gerçek koşum · 4 arıza enjeksiyonlu · 3 atlandı`.
3. Bir senaryo hem happy path hem hata yolu içeriyorsa **ikiye bölünür.** Karışık test,
   neyin gerçek doğrulandığını gizler.

Beyan zorunluluğu kitin her yerindeki desenin aynısı: `Bağımsızlık: ZAYIF`,
`Sınav geçerliliği: DÜŞÜK`. Bozunmayı gizleme, etiketle.

---

## 5. `(*)` senaryolarının özel durumu

`(*)` = doğrulamada şüpheli çıkmış ama statik olarak kanıtlanamamış. Yani **doğru
cevabı bilmiyoruz.**

```
(*) senaryosunu otomatikleştirmek için beklenen değeri yazman gerekir.

  Değeri KODDAN alırsan   ──> test kodun mevcut halini onaylar. Şüphe "çözülmüş"
                              görünür ama hiçbir şey doğrulanmamıştır. ZEHİR.

  Değeri ANALİZDEN alırsan ──> gerçek test. Ama analiz o değeri çivilemiyorsa
                               alacak yer yok.
```

Karar:

- **TUR-2 durumu:** `(*)` ve analiz değeri çivilemiyor → tur 1'de otomatikleşmez. Elle
  koşulur, analist karar verir. Sonuç geldikten sonra doğru değer bilinir ve regresyon
  testine dönüşür. En değerli otomatik testler bunlardır — gerçekten kırılmış yerler.
- **İstisna:** analiz sınır değerini açıkça çiviliyorsa (`R-04: taksit toplamı ana
  tutara eşit olmalıdır`) tur 1'de de otomatikleşir.

---

## 6. İki faz

```
  Kodlama akışı (DOKUNULMUYOR)
  ─────────────────────────────
  analiz.md ──> plan ──> kod + unit test
                              │
  Doğrulama                   ▼
  ─────────      /dv-dogrula ────> SONUC.md · ANALISTE-GIDECEK.md · ic/
                        │
                        ├── KAPI 5.5  KOPRU        (koşullu)
                        ├── KAPI 5.6  OTOMAT  ◄── FAZ A, BU TUR
                        │             ic/otomasyon-yargisi.md
                        └── KAPI 5.7  ANALIST      (kod görmez)

  ┌────────────────────────────────────────────────────────┐
  │  FAZ B — SONRAKİ TUR:  /dv-otomat                      │
  │  AYRI TASK, AYRI BRANCH                                │
  │  girdi: ic/otomasyon-yargisi.md + ic/rtm.md + kod      │
  │  çıktı: test dosyaları (repo'nun mevcut aracıyla)      │
  └────────────────────────────────────────────────────────┘
```

**Neden faz B ayrı task, ayrı branch:** `/dv-dogrula` içinde *"test dosyası yazma"*
yasağı var ve doğru. Düzelten taraf doğrulayamaz; aynısı test için de geçerli. Bulguyu
bulan bağlam testi yazarsa test bulgunun etrafından dolaşır.

Yasak `/dv-dogrula`'da **aynen kalıyor.**

---

## 7. Faz A — ne yapılıyor

### 7.1 Yargı ayrı dosyada  (karar D3)

`ic/otomasyon-yargisi.md`. `ic/analist-girdisi.md`'ye **dokunulmuyor** — o dosya
`ANALIST` görevinin üç girdisinden biri; oraya teknik gerekçe yazmak v0.6.0 sızıntı
düzeltmesini geri açardı. Ve iki koruma da yakalamazdı: `OKUNAN_KOD_DOSYASI` yeşil
kalır (kaynak dosyası okunmadı), §3b grep `köprü`/`jsdom` gibi düz kelimeleri tutmaz.

```markdown
# Otomasyon Yargısı — <konu>

| Test | Otomat | Gerekli hesap | Gerekçe |
|---|---|---|---|
| MT-01 | EVET        | limit-50k-kullanilan-45k | — |
| MT-03 | EVET        | limit-50k-tam-sinirda    | — |
| MT-04 | EVET-ARIZA  | limit-50k-kullanilan-45k | servis 500 → `page.route` ile enjekte |
| MT-06 | HAYIR-CIHAZ | —                        | uygulamadan çıkıp dönme |
| MT-07 | TUR-2       | taksitli-kredi-aktif     | (*) — analiz beklenen değeri çivilemiyor |
| MT-09 | BELİRSİZ    | ?                        | senaryonun hangi ekrana gittiği bulunamadı |

## Gerekli hesaplar — developer sağlayacak
- `limit-50k-kullanilan-45k` — MT-01, MT-03
- `taksitli-kredi-aktif` — MT-07 (tur 2'de)
```

**`Otomat` değerleri:**

| Değer | Anlamı |
|---|---|
| `EVET` | Adımlar container+child içinde kalıyor **ve** ön koşul bir hesapla kurulabilir |
| `EVET-ARIZA` | Hata yolu — arıza enjeksiyonuyla otomatikleşir (§4d), raporda ayrı sayılır |
| `HAYIR-CIHAZ` | Kilit, arka plan, geri tuşu, biyometri, push, kamera |
| `HAYIR-VERI` | Ön koşul hiçbir hesapla kurulamıyor (zamana bağlı durum, geçmiş tarih) |
| `TUR-2` | `(*)` ve analiz beklenen değeri çivilemiyor — analist kararından sonra |
| `BELİRSİZ` | Karar verilemedi |

**`BELİRSİZ` zorunlu bir durum.** İkili `EVET/HAYIR` tahmin etmeye zorlar. Kitin her
yerinde dürüst bozunma etiketi var (`Bağımsızlık: ZAYIF`, `Sınav geçerliliği: DÜŞÜK`);
aynısı burada. Belirsiz senaryo otomatikleşmez, elle kalır.

**Gerekli hesaplar listesi faz A'nın en somut çıktısı.** Üretici gelmeden de işe yarıyor:
elinde hangi test hesaplarını hazırlaman gerektiğinin listesi oluyor.

`Gerekçe` kolonu yalnız senaryo metninden anlaşılmayan durumlarda dolar. "Telefonu
kilitleyin" zaten kendini anlatıyor. Değeri, *"Onayla'ya dokunun"* gibi masum görünüp
köprüden geçen senaryolarda.

### 7.2 Yeni kapı: KAPI 5.6  (bulgu P2)

KOPRU'ya katlanamaz. `dv-dogrula/SKILL.md:321`:

> `Köprüden geçen bulgu yoksa bu kapıyı atla ve SONUC.md'ye "Köprüye giden: 0" yaz.`

Güveni 7 altı bulgu yoksa — yani işler yolundaysa — KOPRU hiç koşmuyor. Yargı oraya
katlanırsa en sağlıklı değişikliklerde otomasyon verisi hiç birikmez. Sessiz
başarısızlık.

RTM zamanına (KAPI 3) da konamaz: orada henüz bulgu ve güven skoru yok, `(*)` durumu
bilinmiyor.

**KAPI 5.6, KOPRU ile ANALIST arasında, koşulsuz koşar.** O noktada üç bilgi de masada:
senaryolar, kod, güven skorları.

Görev **tek geçişli** yazılır: kapsam bir kez okunur, tüm senaryolar tek geçişte
yargılanır, tek tablo üretilir. "Her senaryo için kodu incele" yazımı 15 senaryoda 15
geçiş demek.

### 7.3 ANALIST kendi agent dosyasına  (karar D4)

`dv-iz-denetci.md:4` `tools: Read, Write, Grep, Glob, Bash` veriyor; aynı dosya
`:292`'de *"`Read`, `Grep`, `Glob` ile kaynak dosyalara erişme"* diyor ve buna "tek
yapısal güvence" adını veriyor. Güvence düz yazı — agent'ın elinde araç duruyor.

```
ÖNCE                              SONRA
dv-iz-denetci.md (353 sat.)       dv-iz-denetci.md
  ├── KAPSAM   kod okur             ├── KAPSAM   kod okur
  ├── RTM      kod okur             ├── RTM      kod okur
  ├── KOPRU    bulgu okur           ├── KOPRU    bulgu okur
  └── ANALIST  okumamalı ←istisna   └── OTOMAT   kod okur    ← istisna kalmadı

                                  dv-analist-paketi.md  (YENİ)
                                  tools: Read, Write     ← Grep YOK, Glob YOK
                                  └── (tek görev)
```

Kural yeteneğe dönüşüyor: kod aramak yasak değil, **imkânsız.**

Kırılma senaryosu (bu yüzden yapılıyor): ileride biri dosyaya ortak bir satır ekler —
*"her görevde önce `ic/kapsam.md`'yi oku"*. ANALIST bunu miras alır. `ic/kapsam.md`
dosya yolları içerir. `OKUNAN_KOD_DOSYASI: 0` yeşil kalır çünkü kaynak dosyası
okunmadı — ama dosya adları Confluence'a gider.

**SIRALI MOD uyarısı:** alt agent yoksa ayrı agent da yok, dolayısıyla araç kısıtı da
yok. Orada koruma yine `§3b` mekanik grep. `dv-dogrula/SKILL.md:295` bunu söylüyor ama
D4'ten sonra yanıltıcı olabilir — netleştirilecek.

### 7.4 Faz A'nın görünen çıktısı

`ic/` iç dosya; developer açmaz. Yargının bugün de değeri var, görünmeli. `SONUC.md`
§4'e tek satır:

> Bu paketteki <n> senaryonun <n>'i **yapısal olarak** elle kalmak zorunda
> (hata yolu, cihaz durumu, zamana bağlı). Her sürümde bunlar tekrar test edilmeli.
> Otomatikleşebilecek <n> senaryo için gereken test hesapları: `ic/otomasyon-yargisi.md`

İkisi de otomasyon hiç gelmese bile işe yarıyor: hangi manuel testin kalıcı olduğunu ve
hangi hesapları hazırlaman gerektiğini söylüyor.

---

## 8. Ön kapı (faz B)

Playwright bankada kullanılabilir — doğrulandı. Yine de `/dv-otomat` üretmeden önce
yoklar, çünkü kit birden fazla repoya kurulabilir:

```
package.json / devDependencies
  ├── @playwright/test  var mı?   ──> EVET: üret
  └── yok                          ──> DUR. Test üretme.
                                       "Bu repoda Playwright yok, kurulum kararı senin."
```

**Yeni bağımlılık asla önerilmez, asla kurulmaz.** Kit sıfır bağımlılık sözü verdi (K3).
Bir repoda araç varsa kullanılır, yoksa iş yapılamaz denir.

Ayrıca ortam profili (`ortam-profili.local.json`) yoksa üretici testleri yazar ama
koşmaz; profil şablonunu üretip developer'a hangi anahtarları doldurması gerektiğini
söyler.

---

## 9. Ölçüm defteri (faz B)

Mevcut kural (`analist-test-paketi.md` §7):

- `(*)` işaretli test KALDI  → **yakalanan** defect, başarı hanesi
- `(*)` işaretsiz test KALDI → **kaçan** defect, `kacan-defectler.md`

Otomasyon araya girerse "kim koştu" kaybolur; otomatın kırdığı, analistin yakaladığı
değildir. `ic/analist-sonuclari.md`'ye **`Koşan`** kolonu gerekecek.

**Faz A'da eklenmiyor.** Otomatik koşan hiçbir şey yok; her satırı `ANALIST` yazan
kolon okuyucuya bir şey öğretmez. Üreticiyle birlikte gelir.

---

## 10. Yargı çürür mü

"Bu senaryo otomatikleşir" kod hakkında bir iddia; kod değişince çürür.

**Kural: yargı koşuma özeldir.** `dogrulama/<tarih>-<konu>/` içinde yaşar. Global bir
"otomatikleşebilir senaryolar" kaydı **kurulmaz.** Faz B üreticisi her koşumda yargıyı
yeniden okur, biriktirmez. Çürüyen veri, veri yokluğundan kötüdür.

---

## 11. Bilinmeyenler

| # | Soru | Durum |
|---|---|---|
| 1 | MFE tek başına lokalde açılıyor mu? | ✅ **EVET** (2026-08-24) |
| 2 | Playwright kullanılabilir mi? | ✅ **EVET** (2026-08-24) |
| 3 | Mock kullanılacak mı? | ✅ **Veri mock'u hayır.** Hata yolları için arıza enjeksiyonu evet (§4d) |
| 4 | Test verisi nasıl duracak? | ✅ **Developer sağlar** — test ne istediğini beyan eder |
| 5 | Container + child portları, auth yöntemi | ⏳ Banka ortamında sağlanacak, ortam profiline yazılacak |
| 6 | Ortam sağlık kontrolü nasıl yapılır? | ⏳ §4c için gerekli: container ve child'ın ayakta olduğunu anlayan en ucuz kontrol |

**Tasarımı bloke eden hiçbir soru kalmadı.** 5 ve 6 üreticinin yazım anında doldurduğu
konfigürasyon; mimariyi değiştirmiyorlar.

---

## 12. Değişecek dosyalar (faz A)

| # | Dosya | Ne | Kaynak karar |
|---|---|---|---|
| 1 | `.claude/agents/dv-analist-paketi.md` | **YENİ** — ANALIST buraya, `tools: Read, Write` | D4 |
| 2 | `.claude/agents/dv-iz-denetci.md` | ANALIST çıkar, `GOREV: OTOMAT` girer | D4, P2 |
| 3 | `.claude/skills/dv-dogrula/SKILL.md` | KAPI 5.6; 5.7 agent adı; SIRALI MOD notu; duvar saati 16→18 dk | P2, P3 |
| 4 | `sablonlar/sonuc-sablonu.md` | §4'e "yapısal olarak elle kalan" satırı | dış ses #3 |
| 5 | `testler/altin-vakalar/AV-4/beklenen.md` | 5.7 regresyonu + TUR-2 beklentisi | IRON RULE, D5 |
| 6 | `testler/altin-vakalar/AV-5/beklenen.md` | HAYIR/köprü beklentisi | D5 |
| 7 | `testler/altin-vakalar/AV-6/beklenen.md` | **KAPI 5.6 temiz koşumda koştu mu** | D5, kritik gap |
| 8 | `testler/altin-vakalar/AV-11/beklenen.md` | HAYIR/cihaz beklentisi | D5 |
| 9 | `testler/altin-vakalar/AV-12-otomasyon-yargisi/` | **YENİ** — BELİRSİZ, çivili-`(*)`, boş girdi | D5 |
| 10 | `TODOS.md` | #1 güncelle: faz A kapandı, faz B + §11 bekliyor | — |
| 11 | `KURULUM.md`, `KURULUM-TASK-MODU.md` | yeni agent dosyası kopyalanacak | D4 |
| 12 | `README.md`, `VERSION` | v0.8.0 | — |

12 dosya — kabul edilen kapsamın (3 dosya) üstünde. Büyüme review'ın kendi
bulgularından geldi ve **D4 ile D5'te açıkça onaylandı**; 9'u tek satırlık altın vaka
eklemesi ve doküman güncellemesi.

---

## 13. NOT in scope

| Ertelenen | Gerekçe |
|---|---|
| `/dv-otomat` üretici skill + agent | §11'deki 6 bilinmeyen cevaplanmadan yazılamaz |
| `ic/analist-sonuclari.md` `Koşan` kolonu | Faz A'da otomatik koşan yok; sabit değerli kolon gürültü |
| CI entegrasyonu | TODOS #3, ayrı karar, PR platformu belirsiz |
| Cihaz otomasyonu (Appium/Maestro) | Native kabuk başka ekibin; kapsam dışı |
| RTL / jsdom ekran testi katmanı | Senaryoyu bölüyor, `R-xx ↔ MT-xx` zincirini kırıyor |
| Veri mock'u — backend'i konuşturmadan koşmak | Karar: gerçek ortam. Arıza enjeksiyonu (§4d) bunun dışında |
| Görsel regresyon | Ayrı araç sınıfı, ayrı karar |
| Test hesabı üretme / sıfırlama otomasyonu | Hesapları developer sağlıyor; suite sadece ne gerektiğini söyler |
| Test verisi / ortam yönetimi | Otomasyondan bağımsız organizasyonel iş |
| Yeni test aracı kurulumu | **Hiçbir koşulda.** K3 sıfır bağımlılık |
| `dv-kavra` tarafına dokunma | Kavrayış sınavı bu işten bağımsız |

---

## 14. Zaten var olan — yeniden yazılmayanlar

| Var olan | Bu plan onu kullanıyor mu |
|---|---|
| `ic/rtm.md` — R-xx ↔ `path:line` | **Evet**, yeniden eşleme yapılmıyor |
| `ic/analist-girdisi.md` — MT-xx senaryoları | **Evet**, senaryo çıkarma katmanı yazılmıyor |
| KAPI 5.5 köprüsü — güven < 7 → `(*)` | **Evet**, TUR-2 kararı buna dayanıyor |
| `analist-test-paketi.md` §2 yazım kuralları | **Evet**, otomasyona uygunluk buradan geliyor (§2) |
| `testler/altin-vakalar/` 11 vaka | **Evet**, 4'ü genişletiliyor, 1 yeni ekleniyor |
| AV-6 — köprüye hiçbir şey gitmeyen koşum | **Evet**, kritik gap'in doğal yeri orası |
| `dv-iz-denetci` KAPSAM/RTM yetkinliği | **Evet**, OTOMAT aynı agent'a biniyor |
| `SONUC.md` §4 manuel test bölümü | **Evet**, yeni bölüm açılmıyor |

Yeniden inşa edilen hiçbir şey yok.

---

## 15. Failure modes

| Yeni yol | Gerçekçi prod hatası | Test var mı | Hata yönetimi | Kullanıcı görür mü |
|---|---|---|---|---|
| KAPI 5.6 temiz koşumda atlanır | Yargı dosyası hiç üretilmez | AV-6 (ekleniyor) | Yok → eklenecek | **Hayır** |
| OTOMAT karar veremez, sessizce EVET der | Otomatikleşemeyecek senaryo listeye girer | AV-12 (yeni) | `BELİRSİZ` durumu | Hayır → `SONUC.md` §4 |
| KAPI 5.7 eski agent adını çağırır | Analist paketi hiç üretilmez | AV-4 (ekleniyor) | Sağlık işareti eksik kalır | Evet, paket yok |
| Yeni agent'a Grep geri gelir | Sızıntı kanalı açılır | Mekanik grep | Frontmatter kontrolü | Hayır |
| Yargı, senaryo metnini teknikleştirir | — | AV-4 dil kontrolü | Ayrı dosya, ANALIST okumaz | Hayır |

**Kritik gap:** ilk satır. Test yok + hata yönetimi yok + sessiz — üç koşul da
sağlanıyor. AV-6 eklemesi bu yüzden isteğe bağlı değil.

---

## 16. Paralel yürütme

| Şerit | Dokunulan modüller | Bağımlı |
|---|---|---|
| A — agent ayrımı + yeni kapı | `.claude/agents/`, `.claude/skills/` | — |
| B — altın vakalar | `testler/altin-vakalar/` | Sözleşme kararı (verildi) |
| C — doküman + sürüm | kök `*.md`, `sablonlar/` | A |

```
Şerit A ──┬──> Şerit C
Şerit B ──┘
```

A ve B paralel worktree'de koşabilir; ortak dizin yok, çakışma riski yok. İkisi
birleştikten sonra C.

---

## Implementation Tasks

Bu review'ın bulgularından türetildi. Her madde bir bulguya bağlı.

- [x] **T1 (P1, human: ~1s / CC: ~10dk)** — agents — `dv-analist-paketi.md` oluştur,
      ANALIST bölümünü taşı, frontmatter `tools: Read, Write`
  - Surfaced by: Code Quality — `dv-iz-denetci.md:4` araç listesi ile `:292` yasağı çelişiyor
  - Files: `.claude/agents/dv-analist-paketi.md`, `.claude/agents/dv-iz-denetci.md`
  - Verify: `grep -E 'Grep|Glob' .claude/agents/dv-analist-paketi.md` boş dönmeli

- [x] **T2 (P1, human: ~2s / CC: ~15dk)** — agents — `GOREV: OTOMAT` ekle, tek geçişli yaz
  - Surfaced by: Architecture D3 (yargı katmanı) + gerçek-ortam kararı
  - Files: `.claude/agents/dv-iz-denetci.md`
  - Rubrik: `EVET / EVET-ARIZA / HAYIR-CIHAZ / HAYIR-VERI / TUR-2 / BELİRSİZ`, artı her
    `EVET`/`EVET-ARIZA` için **gerekli hesap** anahtarı — senaryonun "Ön koşul / Veri"
    kolonundan türetilir. `EVET-ARIZA` için hangi isteğin bozulacağı da yazılır
  - Verify: sağlık işaretleri `YARGILANAN`, `YARGILANAMAYAN`, `OTOMATIKLESEBILIR`,
    `GEREKLI_HESAP` üretiliyor

- [x] **T3 (P1, human: ~1s / CC: ~10dk)** — skills — KAPI 5.6 ekle (koşulsuz), KAPI 5.7
      agent adını değiştir, SIRALI MOD notunu netleştir, duvar saati 16→18
  - Surfaced by: Architecture P2 (`SKILL.md:321` köprü atlanabiliyor) + Performance P2/P3
  - Files: `.claude/skills/dv-dogrula/SKILL.md`
  - Verify: KAPI 5.6 metninde koşul cümlesi yok

- [x] **T4 (P1, human: ~30dk / CC: ~5dk)** — testler — AV-4'e KAPI 5.7 regresyonu
  - Surfaced by: Test review — IRON RULE, agent adı değişimi mevcut davranışı değiştiriyor
  - Files: `testler/altin-vakalar/AV-4-para-float/beklenen.md`
  - Verify: paketi `dv-analist-paketi` üretti, `OKUNAN_KOD_DOSYASI: 0` hâlâ yayınlanıyor

- [x] **T5 (P1, human: ~30dk / CC: ~5dk)** — testler — AV-6'ya "temiz koşumda KAPI 5.6 koştu mu"
  - Surfaced by: Test review — kritik gap, sessiz başarısızlık
  - Files: `testler/altin-vakalar/AV-6-yanlis-pozitif-tuzagi/beklenen.md`
  - Verify: `Köprüye giden: 0` iken `ic/otomasyon-yargisi.md` var

- [x] **T6 (P2, human: ~1s / CC: ~10dk)** — testler — AV-12 yeni vaka: BELİRSİZ, çivili-`(*)`, boş girdi
  - Surfaced by: Test review D5 — 3 dal hiçbir mevcut vakaya denk gelmiyor
  - Files: `testler/altin-vakalar/AV-12-otomasyon-yargisi/`
  - Verify: karar verilemeyen senaryoda `EVET` çıkarsa vaka kalır

- [x] **T7 (P2, human: ~30dk / CC: ~5dk)** — testler — AV-5 ve AV-11'e yargı beklentileri
  - Surfaced by: Test review D5
  - Files: `AV-5-kopru-fail-open/beklenen.md`, `AV-11-webview-oldurulmesi/beklenen.md`
  - Verify: ikisinde de `HAYIR` + gerekçe bekleniyor

- [x] **T8 (P2, human: ~30dk / CC: ~5dk)** — sablonlar — `SONUC.md` §4'e yapısal-elle satırı
  - Surfaced by: Outside voice #3 — faz A'nın görünen çıktısı yok
  - Files: `sablonlar/sonuc-sablonu.md`
  - Verify: şablonda satır var

- [x] **T9 (P3, human: ~30dk / CC: ~5dk)** — dokuman — TODOS #1 güncelle, KURULUM'lara yeni
      agent dosyası, README + VERSION 0.8.0
  - Surfaced by: Step 0 TODOS çapraz kontrolü
  - Files: `TODOS.md`, `KURULUM.md`, `KURULUM-TASK-MODU.md`, `README.md`, `VERSION`
  - Verify: kurulum komutu yeni agent'ı kopyalıyor

- [x] **T10 (P1)** — bankada — MFE tek başına lokalde açılıyor mu → **EVET** (2026-08-24)
- [x] **T11 (P1)** — bankada — Playwright kullanılabilir mi → **EVET** (2026-08-24)
- [x] **T12 (P1)** — karar — mock kullanılacak mı → **HAYIR**, gerçek ortam (2026-08-24)
- [x] **T13 (P1)** — karar — test verisi → **developer sağlar**, test beyan eder (2026-08-24)

- [x] **T14 (P2, human: ~1s / CC: ~20dk)** — sablonlar — `sablonlar/otomasyon-sozlesmesi.md`:
      ortam profili şablonu, hesap beyan biçimi, SKIP≠FAIL kuralı, sağlık kontrolü,
      tüketim raporu, **arıza enjeksiyonu izin/yasak listesi ve beyan biçimi**
  - Surfaced by: §4b, §4c, §4d — gerçek ortam kararının doğurduğu sözleşme
  - Files: `sablonlar/otomasyon-sozlesmesi.md`, `sablonlar/gitignore-eki`
  - Verify: profil dosyası `.gitignore`'da, şablonda hiçbir kimlik bilgisi yok;
    enjeksiyon kuralı "başarılı yanıt uydurma" yasağını içeriyor

- [ ] **T15 (P3, human: ~30dk / CC: —)** — bankada — container/child portları, auth yöntemi
      ve en ucuz sağlık kontrolünü ortam profiline yaz
  - Surfaced by: §11 #5 ve #6 — üreticinin konfigürasyonu
  - Files: hedef repoda `ortam-profili.local.json`
  - Verify: `playwright.config.ts` iki `webServer` ile ikisini de kaldırabiliyor

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean | 4 issues, 1 critical gap, SCOPE_REDUCED |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**REVERSAL (2026-08-24):** Review sırasında koşum katmanı için **A (RTL/jsdom)**
önerilmişti; gerekçe "Playwright bankada kurulamaz" idi. Kullanıcı Playwright'ın
kullanılabilir olduğunu ve mock istemediğini bildirdi. Öneri **B (Playwright, gerçek
ortam)** olarak değiştirildi — ikinci ve daha güçlü gerekçe: analist senaryosunun doğal
tanesi Playwright'a uyuyor, RTL senaryoyu bölerek `R-xx ↔ MT-xx` zincirini kırıyor.
`§4b` "mock sözleşmesi" bölümü düştü, yerine "ortam ve hesap sözleşmesi" geldi.

**REVİZYON (2026-08-24, ikinci):** Hata yolları önce `HAYIR-HATA` olarak kapsam dışına
alınmıştı. Kullanıcı DevTools tarzı ağ engelleme/override'ın kabul edilebilir olduğunu
belirtti. `§4d` eklendi: **veri mock'u ile arıza enjeksiyonu ayrıldı** — enjeksiyon gerçek
bir isteği bozabilir, başarılı yanıt uyduramaz. Rubrikte `HAYIR-HATA` → `EVET-ARIZA`.
Otomasyon kapsamı belirgin şekilde büyüdü.

**VERDICT:** ENG CLEARED — faz A uygulanabilir, tasarımı bloke eden soru kalmadı.

NO UNRESOLVED DECISIONS
