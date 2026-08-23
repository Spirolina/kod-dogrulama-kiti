# Doğrulama Fişi — Şablon

**Tek sayfa kuralı.** Fiş bir A4'ü aşarsa doldurulmaz, doldurulmazsa süreç ölür.
Serbest metin minimumda; alanlar sabit, çoğu sayı veya tek satır.

Dosya: `dogrulama/<tarih>-<konu>/05-fis.md`
Doldurma: `/dv-dogrula` taslağı üretir (kademe, sağlık, RTM, bulgular) → `/dv-kavra` viva
bölümünü doldurur → developer manuel sonuçları ve imzayı ekler.

---

## Şablon (buradan aşağısı kopyalanır)

```markdown
# Doğrulama Fişi — <konu>

Tarih: <YYYY-AA-GG>   ·   Developer: <ad>   ·   Analiz: <confluence linki>
Değişiklik: <branch / commit / PR>

## Kademe
Kademe: **T?**   ·   Tetikleyici: <TR-?  veya  "iş mantığı, tetikleyici yok">
Düşürüldü mü: <hayır | evet — gerekçe: ...>
Mod: <A (diff) | B (keşif)>   ·   B ise kapsam onaylandı: <evet/hayır>

## Bağımsızlık
Ortam: <terminal | task>
Alt agent: <var | yok — SIRALI MOD>
Durum: <TAM | ZAYIF — sıralı modda koşuldu | İHLAL — kirli oturumda koşuldu>

## Sağlık işaretleri
Okunan dosya: <n>   ·   Koşulan lens: <n>/<n>   ·   Atlanan dosya: <n>
Üretilen bulgu: <n>   ·   Çürütmeden sağ çıkan: <n>   ·   Çürütme oranı: <%>
Analist paketi: <n> senaryo   ·   teknik sızıntı: <n>   ·   kod dosyası okundu: <n>

## RTM özeti
✅ <n>   ⚠️ <n>   ❌ <n>   ❓ <n>   ➕ <n>   ⚪ <n>   (toplam gereksinim: <n>)

Gereksinimsiz kod (➕) — her satır gerekçeli olmak zorunda:
| Kod | Gerekçe |
|---|---|
| <file:line> | <neden var> |

Analiz dışı sözlü değişiklikler (⚪):
| Gereksinim | Sözlü değişiklik | Kim söyledi |
|---|---|---|
| R-?? | <ne değişti> | <analist> |

## Bulgular (sadece ayakta kalan P1/P2)
| ID | Dosya | Sev | Güven | Durum |
|---|---|---|---|---|
| L?-?? | <file:line> | P? | ?/10 | <düzeltildi / kabul edildi / TODO> |

P3'ler: <n> adet, TODOS.md'ye eklendi.

## Manuel test (analistler)
Confluence sayfası: <link>
Gönderilen senaryo: <n>   ·   (*) odak işaretli: <n>
Geçti: <n>   ·   Kaldı: <n>   ·   Koşulmadı: <n>
Kalan testler: <MT-?? — kısa açıklama>
Kapsanmayan gereksinim: <R-?? — neden>

## Kavrayış sınavı (viva)
Nerede koşuldu: <terminal Claude | Copilot | Windsurf | koşulmadı>
Skor: <n>/<n>   ·   Eşik: <n>
Zayıf çıkan alanlar: <soru tipi — konu>
Aksiyon: <kod basitleştirildi | doküman eklendi | aksiyon yok>

## Kalan riskler
- <tek satır — bilinen ve kabul edilen risk>

## Açık sorular
- <tek satır — cevabı olmayan, sahibi belli soru>

## İmza
- [ ] Viva sorularını **koda bakmadan** cevapladım.
- [ ] Kalan riskleri okudum ve bu haliyle merge edilmesini kabul ediyorum.

Durum: **<İMZALANDI | KAPATILAMADI>**
Kapatılamadıysa sebep: <...>
İmza: <ad>   ·   <YYYY-AA-GG>

## Geri besleme (sonradan doldurulur)
UAT/prod'a kaçan defect oldu mu: <hayır | evet — hangi kapı kaçırdı: G?/L?>
kacan-defectler.md'ye işlendi: <evet/hayır>
```

---

## Fiş kapatılamaz — bunlardan biri varsa

| Koşul | Neden |
|---|---|
| RTM'de `❌` var | Analizde istenen bir şey kodda yok |
| Sağlık işareti eksik veya `okunan dosya: 0` | Doğrulama gerçekten koşmadı — boş rapor "temiz" değildir (P10) |
| Ayakta kalan **P1** bulgu düzeltilmedi | Prod'da para/veri/güvenlik/servis riski |
| B modunda kapsam onaylanmadı | Yanlış kod incelenmiş olabilir |
| `➕` satırı var, gerekçesi yok | İstenmeyen davranış eklenmiş olabilir |
| Kademe düşürüldü, gerekçe yazılmadı | Koruma sessizce kaldırılmış |
| Viva eşiğin altında ve aksiyon yok | Kod savunulamıyor (P8) |
| Duvar saati hedefi aşıldı ve değişiklik bölünmedi | Değişiklik doğrulanamayacak kadar büyük (P7) |
| Doğrulama task'ı ürün kodunu değiştirmiş | Düzelten taraf doğrulayamaz — zincir kırık, yeniden koşulmalı |
| `04a`'da teknik sızıntı var | Confluence'a yapıştırıldıktan sonra geri alınamaz |

`Bağımsızlık: ZAYIF` fişi **kapatmaz** — bilinerek kabul edilmiş bir düşüştür, kayda
geçer. `İHLAL` de kapatmaz ama kaçan defect analizinde ilk bakılacak satırdır.

`❓` (bulamadım) ve `⚠️` (kısmi) kapatmayı **engellemez** — ama fişte açıkça durur ve
imzayla birlikte kabul edilmiş sayılır. Fark bilinçli: `❌` kesin eksiklik, `❓` belirsizlik.

## Doldurma kuralları

- Sayı alanları boş bırakılmaz. Bilinmiyorsa `?` değil, `0` veya `bilinmiyor` yazılır.
- "Kalan riskler" boş bırakılmaz. Gerçekten yoksa `yok` yazılır — boş alan "düşünülmedi"
  demektir, `yok` "düşünüldü ve yok" demektir.
- Bulgu tablosuna P3 yazılmaz, sadece sayısı verilir. Fiş şişmemeli.
- Ham bulgu metinleri fişe kopyalanmaz; `02-bulgular.md`'de durur, fiş sadece ID verir.
- Confluence linki dışında hiçbir dış bağlantı gerekmez.
