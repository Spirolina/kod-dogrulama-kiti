# Çalıştırma — kodu bitirdim, şimdi ne yapacağım

Tek sayfa. Sırasıyla oku, sırasıyla yap.

Kitin dört komutu var ve **hiçbiri diğeriyle aynı oturumda koşmaz.** Karışıklığın
tamamı buradan çıkıyor, o yüzden en başta duruyor.

---

## Kural sıfır — oturum sınırı

| Komut | Nerede koşar | Neden ayrı |
|---|---|---|
| `/dv-dogrula` | **yeni** task / temiz oturum | Kodu yazan bağlam kendi kodunu doğrulayamaz |
| `/dv-kavra` | interaktif araç (Claude Code, Copilot, Windsurf) | Cevabı **sen** üreteceksin |
| `/dv-otomat` | **yeni** task + **ayrı branch** | Bulguyu bulan bağlam testi yazarsa test bulgunun etrafından dolaşır |
| `/dv-triyaj` | **yeni** task | Testi yazan kendi testini yargılayamaz |

Aynı oturumda ikisini koşmak hata vermez — **sessizce kötü sonuç verir.** `/dv-dogrula`
kirli oturumu yakalar ve durur; diğer üçü yakalamaz, güvenme.

Terminal'desen: `/clear` ya da yeni sekme. Task tabanlı ortamdaysan: yeni task.

---

## Faz A — her değişiklikte (zorunlu)

```
kod bitti
   │
   │  ◄── YENİ TASK ──────────────────────────────────
   ▼
1. /dv-dogrula                                       ~15 dk
   çıktı: SONUC.md · ANALISTE-GIDECEK.md
   │
   ▼
2. SONUC.md — SADECE "Durum:" satırı + §8              1 dk
   Doğrulama gerçekten koştu mu? §8'de sıfırlar var mı?
   │        §2'yi (bulgular) AÇMA. Sebep aşağıda.
   │
   ├──► 3. ANALISTE-GIDECEK.md → Confluence            5 dk
   │       Hemen gönder. Sınavdan bağımsız, analistleri bekletme.
   │
   │  ◄── İNTERAKTİF ARAÇ ────────────────────────────
   ▼
4. /dv-kavra — kavrayış sınavı                        15 dk
   Koda BAKMADAN cevapla. §2'yi hâlâ açmadın.
   │
   ▼
5. Şimdi SONUC.md'yi tam oku — §1 (❌ ve ➕) + §2      10 dk
   │
   ▼
6. Düzelt. P1'ler merge'i bloklar.
   │
   ▼
7. Analist sonuçları döner → SONUC.md §4
   │
   ▼
8. SONUC.md kapanır → imza → merge
```

**2. adımda neden §2'yi açmıyorsun:** bulgular kodun kırılgan noktalarını gösterir, sınav
soruları da aynı noktalara gelir. Önce okursan sınav "kodu anlıyor musun"u değil "raporu
hatırlıyor musun"u ölçer. Skor yüksek çıkar, hiçbir şey ifade etmez.

`Durum:` satırı ve §8 sağlık işaretleri bulgu içermez — sınavı kirletmez.

**Tek istisna:** prod'da acil bir şey varsa önce düzeltirsin, sınav geçersizdir ve
`SONUC.md` §5'e *"sınav bulgular okunduktan sonra yapıldı — skor geçerli değil"* yazılır.
Sessizce geçme.

---

## Faz B — otomasyon (bir kez, senaryo kümesi başına)

Faz A kapandıktan **sonra.** Her değişiklikte değil — senaryo kümesi değiştiğinde.

```
   │  ◄── YENİ TASK + AYRI BRANCH ─────────────────────
   ▼
/dv-otomat
   girdi: ic/otomasyon-yargisi.md (EVET + EVET-ARIZA satırları)
   çıktı: <testDir>/MT-xx.spec.js · OTOMASYON.md
```

Testleri **yazar, koşmaz.** Koşum senin adımın:

```bash
PLAYWRIGHT_JSON_OUTPUT_NAME=kosum.json npx playwright test --reporter=json,html
```

`ic/otomasyon-yargisi.md` içinde hiç `EVET` yoksa bu fazı atla — sıfır test üretmek
doğru cevap olabilir.

---

## Faz C — triyaj (her koşumdan sonra, tekrarlayan)

```
testler koştu (bazısı geçti, bazısı kaldı)
   │
   │  ◄── YENİ TASK ──────────────────────────────────
   ▼
/dv-triyaj
   girdi: kosum.json + dogrulama/<tarih>-<konu>/
   çıktı: ic/triyaj.md · kosum-gecmisi.jsonl'a bir satır
   │
   ▼
yargılar dağılır:
   KOD            → developer düzeltir (ayrı task)
   TEST           → otomasyon düzeltir (ayrı task, /dv-otomat branch'i)
   GEREKSINIM     → analiste git, test bayat
   FLAKY          → sahip ata, yoksa üç koşum sonra görmezden gelinir
   TABAN-YOK      → belirtilen commit'te bir kez koş, taban kur
   YESIL-KANITSIZ → trace ile arıza enjeksiyonunun tuttuğunu doğrula
```

Bundan sonra her koşumda **sadece faz C** tekrarlanır. Faz A yalnız kod değiştiğinde,
faz B yalnız senaryolar değiştiğinde.

---

## Nerede duruyorum — karar tablosu

| Durumun | Koş |
|---|---|
| Kodu yeni bitirdim | `/dv-dogrula` (yeni task) |
| `SONUC.md` elimde, sınavı yapmadım | `/dv-kavra` (interaktif araç) |
| `SONUC.md` kapandı, otomasyon yok | `/dv-otomat` (yeni task + branch) |
| Testler koştu, kırmızılar var | `/dv-triyaj` (yeni task) |
| Triyaj bitti, `KOD` yargısı var | Normal düzeltme task'ı — kit dışı |
| Sadece metin/yorum/biçim değiştirdim | `/dv-dogrula` — T3 çıkar, 2 dk sürer |
| Prod'da yangın var | Önce düzelt. Sonra `/dv-dogrula`, sınavı geçersiz işaretle |

---

## Sık karışan üç şey

**"Doğrulama testleri koşar mı?"** Hayır. `/dv-dogrula` statik bakar, `/dv-otomat` test
yazar, ikisi de koşmaz. Koşum senin makinende. `/dv-triyaj` de koşmaz — koşmuş bir
raporu okur.

**"Analistler `SONUC.md`'yi görecek mi?"** Hayır. İçinde dosya yolu, satır numarası,
mercek kodu, güven puanı var — hem işlerine yaramaz hem gereksiz endişe yaratır. Onlara
giden tek şey `ANALISTE-GIDECEK.md`'nin Confluence'a yapıştırılmış hali.

**"Kırmızı test = bug mu?"** Hayır, dört ihtimalden biri. Ayrımı `/dv-triyaj` yapar ve
varsayılan yargısı **kod bozuldu**'dur — testi susturmak (skip, seçici güncelleme,
timeout artırma) triyaj değil, kanıt imhasıdır.

---

## Çıktı nerede

```
dogrulama/
  <tarih>-<konu>/
    SONUC.md              ← sen bunu okursun, başka bir şey açmazsın
    ANALISTE-GIDECEK.md   ← Confluence'a yapıştırılır
    OTOMASYON.md          ← faz B çıktısı
    ic/                   ← ara dosyalar, denetim izi (ic/OKUBENI.md açıklıyor)
      triyaj.md           ← faz C yargıları
  kosum-gecmisi.jsonl     ← testlerin taban kaydı — silme, commit'le
  kacan-defectler.md      ← sistemin öğrendiği tek yer
```

`kosum-gecmisi.jsonl` silinirse "kod mu bozuldu, test mi" sorusu bir daha cevaplanamaz.
Append-only, commit'lenir, çakışırsa iki taraf da satırlarını korur.
