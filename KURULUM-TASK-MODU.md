# Kurulum — terminalsiz (task tabanlı) Claude ortamı

Terminal erişimin yoksa, Claude'u task açarak kullanıyorsan bu dosya senin için.
Terminal erişimin varsa `KURULUM.md`'ye bak.

## Ortamın şekli

```
task aç → nota prompt yaz → dosya ekle → repo seç → PLAN çıkar → onayla → çalışır
```

Zincirin bu ortamda çalışması için üç şey gerekiyor: kit repoda olacak, not doğru
yazılacak, plan onayı kapsam onayı olarak kullanılacak.

---

## Adım 1 — Kiti ürün reposuna koy

Doğrulanacak reponun **köküne**:

```
.claude/
  skills/
    dv-dogrula/SKILL.md
    dv-kavra/SKILL.md          # task ortamında koşmaz, interaktif araç için
  agents/
    dv-iz-denetci.md
    dv-analist-paketi.md        # tools: Read, Write — kod arayamaz, bu kasıtlı
    dv-celiskici.md
    dv-curutucu.md
    dv-kavrayis-kocu.md
sablonlar/
  lens-paketi.md
  risk-rubrigi.md
  sonuc-sablonu.md
  analist-test-paketi.md
  otomasyon-sozlesmesi.md
  task-notu.md
  gitignore-eki                 # içeriğini reponun .gitignore'una ekle
CLAUDE.md                       # varsa birleştir, yoksa sablonlar/repo-CLAUDE.md'den kopyala
```

`dv-` öneki çakışmayı önler; repoda başka skill varsa dokunmaz.

`testler/` klasörünü ürün reposuna **taşıma.** Altın vakalar kitin kendi reposunda kalır;
ürün reposunda gereksiz gürültü, üstelik sahte bug'lı kod içerir.

### Çoklu repo alternatifi

Platform birden fazla repo seçmene izin veriyorsa, kiti ayrı bir repoda tutup ürün
reposuyla birlikte seçmeyi dene. İşe yararsa kiti her repoya kopyalamak gerekmez.

Test etme yöntemi: iki repoyu seç, nota *"`.claude/skills/` altında hangi skill'leri
görüyorsun, listele"* yaz, planı oku. `dv-dogrula` görünmüyorsa bu yol kapalı —
Adım 1'e dön.

---

## Adım 2 — İlk task'ı aç

`sablonlar/task-notu.md` içindeki **TASK — Doğrulama** bloğunu kopyala, doldur, nota
yapıştır. Analiz dokümanını ekle.

## Adım 3 — Planı oku, sonra onayla

Plan şu dördünü içermeli:

| Plan başlığı | Neyi doğrular |
|---|---|
| Kademe + tetikleyici | Risk doğru okunmuş mu |
| DAHİL / DAHİL DEĞİL / EMİN DEĞİLİM | **Doğru kod mu inceleniyor** |
| Dosya tipi + lens listesi | Doğru mercekler mi koşacak |
| Alt agent var mı | Bağımsızlık tam mı, zayıf mı |

İkinci satır en önemlisi. Kapsam yanlışsa sistem yanlış kod üzerinde kusursuz çalışır ve
tertemiz bir rapor üretir — elinde sahte güven kalır.

**Planda ürün kodunu değiştirmeye dair tek satır varsa onaylama.** "Bulduğum P1'i
düzelteceğim" cümlesi zinciri kırar: düzelten taraf doğrulayamaz.

---

## Adım 4 — Çıktıyı al

Branch'i çek. `dogrulama/<tarih>-<konu>/` altında ne olduğu ve ne yapılacağı
`sablonlar/task-notu.md` → *"Task bittikten sonra"* bölümünde.

Özet:
- `SONUC.md` → önce bunu oku
- `ANALISTE-GIDECEK.md` → Confluence
- `ic/developer-kontrolleri.md` → **Confluence'a gitmez**, sende kalır

---

## Adım 5 — Kavrayış sınavı (ayrı, senin elinde)

`/dv-kavra` bu ortamda koşmaz — sınav canlı soru-cevap ister, task tek yönlüdür.

Repoyu erişimin olan interaktif bir araçta aç (Claude Code, Copilot, Windsurf) ve orada
koş. `SONUC.md` içindeki viva bölümünü o koşum doldurur.

Sınav neden ayrı kalmalı: cevabı **senin** üretmen gerekiyor. Okumak pasif; okunan rapor
kavrayış üretmez. Bu yüzden sınavı otomatikleştirmeye çalışma — otomatikleşen sınav,
sınav olmaktan çıkar.

---

## Doğrulama — kurulum çalıştı mı

`testler/altin-vakalar/AV-2-eksik-gereksinim/` vakasını kit reposunda koş
(`KURULUM.md`'deki yöntemle) veya ürün reposunda küçük bir T2 değişiklikle dene.

Kurulum başarılı sayılır eğer:

| Kontrol | Beklenen |
|---|---|
| Plan kapsam listesi içeriyor mu | evet |
| Plan ürün kodu değiştirmeyi öneriyor mu | **hayır** |
| `dogrulama/` klasörü commit'lendi mi | **evet** — çıktıyı alma yolun bu |
| `SONUC.md` sağlık işaretleri dolu mu | evet, `okunan dosya: 0` **değil** |
| `dogrulama/` dışına taşan dosya var mı | **hayır** |

### Son satırın komutu

Task'ın dosya yazması **istenen şey** — çıktıyı almanın tek yolu bu. Kontrol edilen
"diff var mı" değil, **diff nereye düşmüş**:

```bash
git diff --name-only <base-branch>...HEAD | grep -v '^dogrulama/'
```

Boş dönmeli. Bir satır bile dönerse doğrulama task'ı ürün koduna dokunmuş demektir:
o zaman sonraki kapılar task'ın kendi yazdığı kodu kontrol etmiş olur ve bağımsızlık
zinciri kırılır. Sonuç kapatılamaz, doğrulama temiz bir branch'ten yeniden koşulur.

Task platformları kodlamak için tasarlanmıştır; bu görevde yeteneği kapatmıyoruz,
**yönünü** sınırlıyoruz. İlk koşumda bir kez gözünle doğrula.

---

## Bilinen belirsizlikler

Bunlar ortama bağlı, önce test et:

| Soru | Nasıl test edilir | Çıkmazsa |
|---|---|---|
| Alt agent (`Agent`) çağrılabiliyor mu | Plana "alt agent durumu" yazdır | SIRALI MOD — çalışır, bağımsızlık zayıflar |
| Skill ana repo dışından yükleniyor mu | Çoklu repo testi (Adım 1) | Kiti her repoya kopyala |
| Task eki nereye düşüyor | Nota "ekteki dosyanın yolunu yaz" ekle | Analizi repoya commit'le |
| `git diff` baz dalı doğru mu | Plandaki dosya sayısını gözle karşılaştır | MOD B'ye geç, kapsamı keşfettir |
