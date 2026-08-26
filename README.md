# Doğrulama Katmanı

AI'ın yazdığı kodun doğruluğundan emin olmak ve developer'ın koda hakimiyet kazanması için
bir doğrulama katmanı. Kodlama akışına dokunmaz — kod yazıldıktan sonra, merge'den önce koşar.

**Hedef mimari:** **her MFE ayrı WebView'da** çalışan React uygulamaları. Native kabuk
(Swift/Kotlin) başka bir ekibin ve **kapsam dışı** — gerektiğinde köprüyle konuşuyoruz.

Temel kural: **bulgu her zaman bizim kodumuzda olur.** "Native şunu yapıyor olabilir"
spekülasyondur. "Native'in şunu yaptığını varsayıyoruz, tutmazsa şu kırılır" — bu bizim
savunma eksikliğimizdir ve bulgu budur. Ölçüt: düzeltmesi bizim repomuzda yapılabiliyor mu?

Lens paketi buna göre yazıldı: JS float aritmetiği, React render/durum kuralları, köprü
çağrısı savunması, oturum ve sıfırdan yükleme dayanıklılığı, mobil UX.

## Nereden başlanır

| | |
|---|---|
| **Hangi komut ne zaman** | **`CALISTIRMA.md`** — kodu bitirdin, sırasıyla ne koşacaksın |
| Günlük kullanım | `NASIL-KULLANILIR.md` — task notu, plan onayı, çıktıyı okuma |
| Kurulum (terminalsiz) | `KURULUM-TASK-MODU.md` |
| Kurulum (terminal) | `KURULUM.md` |
| Tasarım gerekçesi | `DOGRULAMA-WORKFLOW-PLAN.md` |

## Neyi çözüyor

Kod yazma hızı insan doğrulama hızını aşınca iki ayrı boşluk açılıyor:

- **Doğruluk boşluğu** — kod analize uymuyor veya bug var
- **Kavrayış boşluğu** — developer kodu savunamıyor, prod'da gece 3'te açıklayamıyor

İkincisi daha iyi AI özeti okuyarak kapanmaz. Okumak pasif. Bu yüzden AI burada rapor
vermez — **sınar**.

## Sıra

```
doğrulama koşar  →  analist paketi Confluence'a  →  KAVRAYIŞ SINAVI  →  bulgular okunur
```

Sınav bulgulardan **önce**. Bulgular kodun kırılgan noktalarını gösterir; sınav soruları
da aynı noktalara gelir. Önce okunursa sınav, kodu anlamayı değil raporu hatırlamayı
ölçer.

## Dört komut

```
faz A — her değişiklikte
/dv-dogrula     analiz ↔ kod eşleşmesi (RTM) · lenslerle adversarial tarama ·
                bulguları çürütme · analistlere Türkçe manuel test paketi · sonuç dosyası
/dv-kavra       rehberli tur · koda bakmadan sözlü sınav · notlama · boşlukları gösterme

faz B — senaryo kümesi başına bir kez
/dv-otomat      otomasyon yargısından Playwright testleri · ayrı task, ayrı branch

faz C — her koşumdan sonra
/dv-triyaj      kırmızının sebebi: kod / test / gereksinim / ortam · ayrı task
```

**Dördü de kendi oturumunda / kendi task'ında koşulur.** Kodu yazan bağlam kendi kodunu
doğrulayamaz, bulguyu bulan bağlam kendi testini yazamaz, testi yazan kendi testini
yargılayamaz. Sıra ve oturum sınırları: `CALISTIRMA.md`.

## İki ortam

| | Terminal (canlı oturum) | Task tabanlı (plan → onay → çalıştır) |
|---|---|---|
| `/dv-dogrula` | koşar | koşar — kapsam onayı **plan aşamasında** alınır |
| `/dv-kavra` | koşar | **koşmaz** — canlı soru-cevap ister |
| `/dv-otomat` | koşar | koşar — ortam profili plan aşamasında onaylanır |
| `/dv-triyaj` | koşar | koşar |
| Çıktı | T2/T3 lokal kalabilir | her şey commit'lenir |
| Kurulum | `KURULUM.md` | `KURULUM-TASK-MODU.md` |

Task ortamında kavrayış sınavını erişimin olan interaktif bir araçta (Claude Code,
Copilot, Windsurf) kendin koşarsın. Sınavın otomatikleştirilmemesi kasıtlı: cevabı
developer'ın üretmesi gerekiyor, yoksa sınav olmaktan çıkar.

## İki mod

| | A — Değişiklik modu | B — Keşif modu |
|---|---|---|
| Girdi | analiz + diff | analiz + repo |
| Kapsamı kim çizer | diff | agent çizer, **sen onaylarsın** |
| Ne öğretir | değişikliği | tüm akışı |

Diff varsa A, yoksa B otomatik seçilir.

## Çıktı: iki dosya

```
dogrulama/<tarih>-<konu>/
  SONUC.md              ← developer bunu okur, başka bir şey açmaz
  ANALISTE-GIDECEK.md   ← Confluence'a yapıştırılır
  ic/                   ← ara dosyalar ve denetim izi (OKUBENI.md içinde açıklamalı)
```

## Dosya haritası

```
.claude/agents/
  dv-iz-denetci.md        RTM, gereksinim ID çivileme, keşif, köprü, otomasyon yargısı
  dv-analist-paketi.md    analist test paketi — tools: Read, Write (kod arayamaz)
  dv-otomat-yazar.md      senaryo → Playwright testi, seçici uydurmaz
  dv-triyajci.md          kırmızı testin sebebi: kod / test / gereksinim / ortam
  dv-celiskici.md         lens başına adversarial tarama
  dv-curutucu.md          bulgu çürütme (yanlış pozitif eleme)
  dv-kavrayis-kocu.md     rehberli tur, viva soruları, notlama
.claude/skills/
  dv-dogrula/SKILL.md     G0→G2 orkestrasyonu
  dv-otomat/SKILL.md      otomasyon üretimi (faz B) — ayrı task, ayrı branch
  dv-triyaj/SKILL.md      koşum triyajı (faz C) — kırmızının sebebini ayırır
  dv-kavra/SKILL.md       G4 interaktif sınav
sablonlar/
  lens-paketi.md          ★ KANONİK KAYNAK — 16 lens, kademe×dosya tipi matrisi, çıktı biçimi
  task-notu.md            task tabanlı ortam için not şablonu + çıktı kullanımı
  repo-CLAUDE.md          ürün reposuna konacak CLAUDE.md bloğu (task ortamı güvenlik ağı)
  risk-rubrigi.md         T1/T2/T3 kademe kararı
  sonuc-sablonu.md        SONUC.md şablonu — developer'ın okuduğu tek dosya
  analist-test-paketi.md  Confluence wiki markup şablonu
  otomasyon-sozlesmesi.md Playwright koşum modeli, hesap sözleşmesi, arıza enjeksiyonu
testler/altin-vakalar/    workflow'un kendi testi — 13 vaka
dogrulama/                çıktılar + kacan-defectler.md
```

## Çıktılar

Değişiklik başına bir klasör, **iki görünür dosya**:

| Dosya | Ne | Kime |
|---|---|---|
| `SONUC.md` | Durum · ne yapmalısın · analiz↔kod eşleşmesi · bulgular · kendi kontrollerin · manuel test · sınav · sağlık işaretleri · imza | **developer** (tek okunacak dosya) |
| `ANALISTE-GIDECEK.md` | Türkçe manuel senaryolar, teknik dil yok | **analistlere / Confluence** |

`ic/` altında ara dosyalar ve denetim izi durur — `analiz.md`, `kapsam.md`,
`gereksinimler.md` (çivilenmiş R-ID'ler), `rtm.md`, `bulgular-ham.md`,
`bulgular-curutulmus.md`, `developer-kontrolleri.md`, `analist-girdisi.md`,
`otomasyon-yargisi.md`, `analist-sonuclari.md`, `tur.md`, `sinav-anahtari.md`,
`sinav-sonucu.md`.
Hepsi `ic/OKUBENI.md`'de birer satırla açıklanır.

`SONUC.md` bunların özetidir; ayrıntı gerekirse referansı verir. Günlük iş için
`ic/` açılmaz.

## Üç kanıt seviyesi

| Seviye | Ne kanıtlar | Nerede |
|---|---|---|
| Uygunluk | kod, analizde isteneni yapıyor | G1 / RTM — statik |
| Muhakeme | kod doğru çalışıyor | G2 / lensler — statik |
| Kanıt | kod gerçekten çalışıyor | manuel test |

**Köprü:** G2 bir şeyden emin olamadıysa (güven < 7), o şüphe boşluğa düşmez —
analist paketine `(*)` işaretli bir senaryo olarak girer ve elle kanıtlanır.

**Otomasyon yargısı:** her manuel senaryo için "bu makineyle koşulabilir mi, koşulamazsa
neden" kararı verilir (`ic/otomasyon-yargisi.md`). Bu yargı, otomasyon hiç koşulmasa bile
hangi testin **yapısal olarak** elle kalmak zorunda olduğunu ve hangi test hesaplarının
gerektiğini söyler.

Yargı, analist paketinden **sonra** koşar. Sebebi: `MT-xx` numaraları pakette doğuyor.
Önce koşarsa yargı, yazılmamış senaryolara numara tahmin eder ve faz B yanlış senaryoya
test yazar.

## Analist paketi biçimi

Paket analistlerin geri bildirimiyle şekillendi. Beş yapısal parça:

| Parça | Neyi çözer |
|---|---|
| Gereksinim tablosu | `R-01` tek başına hiçbir şey söylemiyordu |
| Koşum planı (hesaba göre) | Test hesabı bulmak en pahalı adım; aynı hesabın testleri yan yana |
| Fonksiyonel bölümler | Kapsam gözle görünür — bölüm başlıkları analizin kendi başlıkları |
| Üç parçalı beklenen sonuç | `ne görünür / nerede / ne değişmemeli` — üçüncüsü regresyonu yakalar |
| Tekrar eleme | Aynı hesap koşulu + aynı adımlar + aynı sonuç = tek senaryo |

Okuma yapısı (fonksiyonel bölüm) ile koşum yapısı (hesap) **ayrıdır.** Tek tabloyu
ikisine birden zorlamak ikisini de bozuyordu.

Müşteri numarası kolonu **boş gider** — kişisel veridir, analist Confluence'ta doldurur.

**Otomasyon üretimi (`/dv-otomat`):** yargıdan Playwright testleri üretir — ayrı task,
ayrı branch. Gerçek ortamda koşar, veri mock'u kurmaz, hata yollarını arıza
enjeksiyonuyla üretir, görmediği seçiciyi uydurmaz. Testleri yazar, **koşmaz** — koşum
developer'ın adımı. Koşum kanıtı olarak ekran görüntüsü üretilir: geçen testte koşum
sonunda, kalan testte kırılma anında, atlanan testte hiç. Tasarım: `OTOMASYON-PLANI.md`
ve `ANALIST-GERIBILDIRIM-PLANI.md`, sözleşme: `sablonlar/otomasyon-sozlesmesi.md`.

**Koşum triyajı (`/dv-triyaj`):** testler koştuktan sonra kırmızıların sebebini ayırır —
kod mu bozuldu, test mi, gereksinim mi değişti, ortam mı. Ayrı task; ürün koduna da test
dosyasına da dokunmaz, çünkü kırmızıyı susturmak (skip, seçici güncelleme, timeout
artırma) triyaj değil kanıt imhasıdır. Varsayılan yargı **kod bozuldu**; değiştirmek
koddan alıntı ister. Ayrımın belkemiği `dogrulama/kosum-gecmisi.jsonl` — testin son ne
zaman yeşil olduğunu tutan tek yer; onsuz regresyon ile hiç çalışmamış test ayrılamaz.
Retry ile geçen ve arıza enjeksiyonlu yeşil testler de yargıya girer: ikisi de yeşil
raporlanır, ikisi de yeşil değildir.

## Kurulum

`KURULUM.md`. Özet: `git clone`, `cp -r`, bitti. Sıfır bağımlılık.

## Bakım

Prod'a kaçan her defect `dogrulama/kacan-defectler.md`'ye yazılır ve sorulur:
*hangi kapı kaçırdı?* Cevap lens paketine yeni bir madde ve yeni bir altın vaka olur.
Bu döngü olmadan workflow ritüele dönüşür.
