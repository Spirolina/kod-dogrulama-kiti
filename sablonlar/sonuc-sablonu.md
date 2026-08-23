# `SONUC.md` — Şablon

Doğrulamanın tek çıktısı. Developer bunu okur, başka bir şey açmak zorunda kalmaz.

Eskiden bu bilgi beş ayrı dosyaya dağılmıştı (`fiş`, `RTM`, `bulgular`, `kontrol listesi`,
`manuel test`). İsimleri jargondu, hangisinin ne olduğu ilk bakışta anlaşılmıyordu.
Bilgi aynı — dağınıklığı kalktı.

Uzunluk hedefi: **iki A4.** Aşıyorsa değişiklik fazla büyük demektir; kısaltma, söyle.

---

## Şablon (buradan aşağısı kopyalanır)

```markdown
# Doğrulama Sonucu — <konu>

**Durum: KAPANMADI**
Sebep: analizde istenen 1 şey kodda yok (R-03) · 1 ciddi bulgu açık (L13-02)

> **Aşağıdaki §2'yi okumadan önce kavrayış sınavını yap.**
> Bulgular kodun kırılgan noktalarını gösterir; sınav soruları da aynı noktalara gelir.
> Önce okursan sınav, kodu anlamanı değil bu raporu hatırlamanı ölçer.

## Ne yapmalısın

1. `ANALISTE-GIDECEK.md` → Confluence'a yapıştır *(analistler beklemesin, sınavdan bağımsız)*
2. Kavrayış sınavı: interaktif bir araçta `/dv-kavra` — **§2'yi okumadan önce**
3. Sonra §1 ve §2'yi tam oku
4. R-03 eksik — kodu tamamla ya da analize dön, gereksinim düşmüş mü kontrol et
5. L13-02 (ciddi) düzelt

---

## Özet

| | |
|---|---|
| Değişiklik | `<branch / commit / PR>` |
| Risk kademesi | **T1** — para hareketi, limit kontrolü |
| Nasıl bakıldı | Değişiklik üzerinden (A modu) · 7 dosya · 11 mercek |
| Süre | 11 dk |
| Bağımsızlık | TAM — kodu yazan bağlam bu doğrulamayı yapmadı |

---

## 1. Analiz ile kod tutuyor mu

Analiz dokümanındaki her istek, kodda karşılığı var mı diye tek tek arandı.
*(Denetim dilinde bu tabloya "izlenebilirlik matrisi / RTM" denir.)*

| | Anlamı | Adet |
|---|---|---|
| ✅ | İstenen kodda var | 6 |
| ⚠️ | Kısmen var | 1 |
| ❌ | **İstenmiş ama kodda yok** | 1 |
| ❓ | Bulamadım (yalnız keşif modunda) | 0 |
| ➕ | **Kodda var ama kimse istememiş** | 2 |
| ⚪ | Kapsam dışı | 0 |

### ❌ İstenmiş ama yok

| # | Analizde ne yazıyor | Nerede olması gerekirdi |
|---|---|---|
| R-03 | "<analizden birebir alıntı>" | <iş dilinde: hangi akışta> |

### ➕ Kimse istememiş ama kodda var

En çok atlanan satır. Ya gereksiz iş, ya da kimsenin test etmeyeceği bir davranış.

| Nerede | Ne yapıyor | Gerekçe |
|---|---|---|
| `<file:line>` | <tek cümle> | <biliniyorsa; bilinmiyorsa "gerekçe yok"> |

### Tam tablo

| # | Gereksinim (analizden birebir) | Durum | Kod karşılığı | Manuel adım |
|---|---|---|---|---|
| R-01 | "<alıntı>" | ✅ | `<file:line>` | MT-01 |
| R-03 | "<alıntı>" | ❌ | — | — |

---

## 2. Bulgular

Kod, 11 mercekten geçirildi ve her bulgu ayrı bir bağlamda çürütülmeye çalışıldı.
Aşağıdakiler çürütmeden **sağ çıkanlar**. Çürütülenler ve gerekçeleri:
`ic/bulgular-curutulmus.md`.

| # | Ciddiyet | Nerede | Ne oluyor | Ne yapıldı |
|---|---|---|---|---|
| L2-01 | **Ciddi** | `<file:line>` | <bir cümle: şu girdi → şu yanlış sonuç> | düzeltildi |
| L13-02 | **Ciddi** | `<file:line>` | <...> | **açık** |
| L11-01 | Orta | `<file:line>` | <...> | kabul edildi |

Ciddiyet karşılıkları — soldaki kelime okunur, sağdaki kod `ic/` dosyalarında geçer:

| Kelime | Kod | Anlamı |
|---|---|---|
| **Ciddi** | P1 | Para, veri, güvenlik veya servis riski. Sonuç kapanmaz |
| Orta | P2 | Yanlış davranış, kullanıcı etkisi var. Karar senin |
| Düşük | P3 | Bakım riski. TODO'ya |

`#` kolonundaki kod, bulguyu bulan merceği gösterir (`L2` = para ve sayı merceği).
Çözmen gerekmiyor; `ic/bulgular-curutulmus.md` içinde aynı kodla tam hâli duruyor.

Düşük seviyeli bulgular buraya yazılmaz.

---

## 3. Senin yapacağın kontroller

Analistin ekrandan yapamayacağı, sende kalan kontroller. Veritabanı, log, servis çağrısı.

| # | Bağlı test | Ne kontrol edilecek | Nerede | Sonuç |
|---|---|---|---|---|
| K-01 | MT-02 | Limit düşüşü kaydedildi mi | `<tablo/kolon>` | |
| K-02 | — | Hata kaydında kişisel veri geçiyor mu | `<log>` | |

---

## 4. Manuel test (analistler)

Paket: `ANALISTE-GIDECEK.md` → Confluence sayfası `<link>`

| | |
|---|---|
| Senaryo | 12 (3 negatif · 2 sınır değeri) |
| `(*)` işaretli | 2 — statik olarak emin olunamayan, elle bakılması gereken yerler |
| Kapsanmayan gereksinim | R-03 — kodda karşılığı yok, test edilecek bir şey yok |

Sonuçlar geldiğinde: <n> geçti · <n> kaldı · <n> koşulmadı
*(Analistten dönen ham tablo: `ic/analist-sonuclari.md`)*

**`(*)` işaretli bir test kaldıysa:** doğrulamanın şüphesi doğrulanmıştır — bu **yakalanan**
defect'tir, başarı hanesine yazılır.
**`(*)` işaretsiz bir test kaldıysa:** hiçbir mercek bunu öngörmemiştir —
`dogrulama/kacan-defectler.md`'ye yazılır ve "hangi mercek kaçırdı" sorulur.

---

## 5. Kavrayış sınavı

Nerede koşuldu: <terminal Claude | Copilot | Windsurf | koşulmadı>
Sınav geçerliliği: <NORMAL — bulgular okunmadan önce koşuldu | DÜŞÜK — sonra koşuldu>

| | |
|---|---|
| Skor | 11/14 · Eşik: 10 · **GEÇTİ** |
| Zayıf alan | Hata yolu — kısmi yazma sonrası ne olduğu |
| Aksiyon | <kod basitleştirildi / doküman eklendi / aksiyon yok> |

Eşik altındaysa aksiyon iki başlıktan biri olmak zorunda: **kod fazla karmaşık** (böl) veya
**değişiklik fazla büyük** (parçala). "Daha dikkatli okumalı" yazılmaz.

---

## 6. Kalan riskler

- <tek satır — bilinen ve kabul edilen risk>

## 7. Açık sorular

- <analiste veya ürüne sorulacak, cevabı beklenen>

---

## 8. Sağlık işaretleri

Doğrulamanın gerçekten koştuğunun kanıtı. Boş çıktı "temiz" değildir.

| | |
|---|---|
| Okunan dosya | <n> |
| Koşulan mercek | <n>/<n> · atlanan dosya: <n> |
| Üretilen bulgu | <n> → çürütmeden sağ çıkan: <n> (oran %<n>) |
| Analist paketi | <n> senaryo · teknik sızıntı: **0** · kod dosyası okundu: **0** |
| Ortam | <terminal / task> · alt agent: <var / yok — sıralı mod> |

---

## 9. İmza

- [ ] Bu sonucu okudum, açık maddeleri biliyorum
- [ ] Kavrayış sınavı sorularını **koda bakmadan** cevapladım

<ad> · <tarih>

## 10. Geri besleme (sonradan doldurulur)

| | |
|---|---|
| Prod'a kaçan defect | <var/yok — varsa hangi mercek kaçırdı> |
| Yanlış alarm | <n> — hangi bulgu boşunaydı |
| Merceklere eklenen | <yeni kontrol maddesi / yeni mercek / yok> |
```

---

## `SONUC.md` kapanamaz — bunlardan biri varsa

| Koşul | Neden |
|---|---|
| `❌` var | Analizde istenen bir şey kodda yok |
| Sağlık işareti eksik veya `okunan dosya: 0` | Doğrulama gerçekten koşmadı — boş rapor "temiz" değildir |
| Açık **Ciddi** (P1) bulgu var | Prod'da para/veri/güvenlik/servis riski |
| Keşif modunda kapsam onaylanmadı | Yanlış kod incelenmiş olabilir |
| `➕` var, gerekçesi yok | İstenmeyen davranış eklenmiş olabilir |
| Kademe düşürüldü, gerekçe yazılmadı | Koruma sessizce kaldırılmış |
| Kavrayış sınavı eşiğin altında ve aksiyon yok | Kod savunulamıyor |
| Süre/kapsam hedefi aşıldı ve değişiklik bölünmedi | Değişiklik doğrulanamayacak kadar büyük |
| Doğrulama task'ı ürün kodunu değiştirmiş | Düzelten taraf doğrulayamaz — zincir kırık |
| `ANALISTE-GIDECEK.md`'de teknik sızıntı var | Confluence'a yapıştırıldıktan sonra geri alınamaz |

`❓` ve `⚠️` **kapanmayı engellemez** — bilinen belirsizlik, kayda geçer.
`Bağımsızlık: ZAYIF` de engellemez; bilerek kabul edilmiş bir düşüştür.

---

## Doldurma kuralları

- **Boş bırakma, "—" yaz.** Boş alan "bakılmadı" mı "yok" mu belli değil.
- **Bulgu metnini kısaltırken anlamı değiştirme.** Tam hâli `ic/` altında duruyor.
- **Ciddiyet seviyesini burada değiştirme.** Çürütme neyi bıraktıysa o.
- **Durum satırı en üstte ve tek cümle.** Okuyan ilk ekranda ne olduğunu anlamalı.
- **`ic/` klasörüne referans ver, içeriğini kopyalama.** Bu dosya özet, arşiv değil.
