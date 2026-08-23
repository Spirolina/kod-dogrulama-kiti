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
| **Günlük kullanım** | **`NASIL-KULLANILIR.md`** — task notu, plan onayı, çıktıyı okuma |
| Kurulum (terminalsiz) | `KURULUM-TASK-MODU.md` |
| Kurulum (terminal) | `KURULUM.md` |
| Tasarım gerekçesi | `DOGRULAMA-WORKFLOW-PLAN.md` |

## Neyi çözüyor

Kod yazma hızı insan doğrulama hızını aşınca iki ayrı boşluk açılıyor:

- **Doğruluk boşluğu** — kod analize uymuyor veya bug var
- **Kavrayış boşluğu** — developer kodu savunamıyor, prod'da gece 3'te açıklayamıyor

İkincisi daha iyi AI özeti okuyarak kapanmaz. Okumak pasif. Bu yüzden AI burada rapor
vermez — **sınar**.

## İki komut

```
/dv-dogrula     analiz ↔ kod eşleşmesi (RTM) · lenslerle adversarial tarama ·
                bulguları çürütme · analistlere Türkçe manuel test paketi · fiş taslağı

/dv-kavra       rehberli tur · koda bakmadan sözlü sınav · notlama · boşlukları gösterme
```

`/dv-dogrula` **kendi oturumunda / kendi task'ında** koşulur. Kodu yazan bağlam kendi
kodunu doğrulayamaz; skill bunu kontrol eder.

## İki ortam

| | Terminal (canlı oturum) | Task tabanlı (plan → onay → çalıştır) |
|---|---|---|
| `/dv-dogrula` | koşar | koşar — kapsam onayı **plan aşamasında** alınır |
| `/dv-kavra` | koşar | **koşmaz** — canlı soru-cevap ister |
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

## Dosya haritası

```
.claude/agents/
  dv-iz-denetci.md        RTM, gereksinim ID çivileme, analist test paketi, keşif, köprü
  dv-celiskici.md         lens başına adversarial tarama
  dv-curutucu.md          bulgu çürütme (yanlış pozitif eleme)
  dv-kavrayis-kocu.md     rehberli tur, viva soruları, notlama
.claude/skills/
  dv-dogrula/SKILL.md     G0→G2 orkestrasyonu
  dv-kavra/SKILL.md       G4 interaktif sınav
sablonlar/
  lens-paketi.md          ★ KANONİK KAYNAK — 16 lens, kademe×dosya tipi matrisi, çıktı biçimi
  task-notu.md            task tabanlı ortam için not şablonu + çıktı kullanımı
  repo-CLAUDE.md          ürün reposuna konacak CLAUDE.md bloğu (task ortamı güvenlik ağı)
  risk-rubrigi.md         T1/T2/T3 kademe kararı
  fis-sablonu.md          doğrulama fişi (tek A4)
  analist-test-paketi.md  Confluence wiki markup şablonu
testler/altin-vakalar/    workflow'un kendi testi — 8 vaka
dogrulama/                çıktılar + kacan-defectler.md
```

## Çıktılar

Değişiklik başına bir klasör:

| Dosya | Ne | Kime |
|---|---|---|
| `00-gereksinimler.md` | çivilenmiş R-ID'ler (sözleşme) | sistem |
| `01-rtm.md` | izlenebilirlik matrisi | developer |
| `02-bulgular.md` | çürütmeden sağ çıkan bulgular | developer |
| `03-viva.md` | sınav sonucu | developer |
| `04a-analist-test-paketi.md` | Türkçe manuel senaryolar | **analistlere / Confluence** |
| `04b-developer-kontrol-listesi.md` | DB/log kontrolleri | developer |
| `04c-test-sonuclari.md` | analistten dönen sonuçlar | sistem |
| `05-fis.md` | doğrulama fişi + imza | denetim izi |

## Üç kanıt seviyesi

| Seviye | Ne kanıtlar | Nerede |
|---|---|---|
| Uygunluk | kod, analizde isteneni yapıyor | G1 / RTM — statik |
| Muhakeme | kod doğru çalışıyor | G2 / lensler — statik |
| Kanıt | kod gerçekten çalışıyor | manuel test |

**Köprü:** G2 bir şeyden emin olamadıysa (güven < 7), o şüphe boşluğa düşmez —
analist paketine `(*)` işaretli bir senaryo olarak girer ve elle kanıtlanır.

## Kurulum

`KURULUM.md`. Özet: `git clone`, `cp -r`, bitti. Sıfır bağımlılık.

## Bakım

Prod'a kaçan her defect `dogrulama/kacan-defectler.md`'ye yazılır ve sorulur:
*hangi kapı kaçırdı?* Cevap lens paketine yeni bir madde ve yeni bir altın vaka olur.
Bu döngü olmadan workflow ritüele dönüşür.
