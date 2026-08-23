# Beklenen — AV-4

Test ettiği: `L2` para lensi + **köprü** (güven < 7 → manuel senaryo).

## Üretilmesi gereken — en az iki bulgu
1. **`toFixed` ile yuvarlama + float toplama** — `taksitHesapla.ts:2` ve `:4`
   ALINTI: `const taksit = Number((anaTutar / adet).toFixed(2));`
   SENARYO: "100 TL / 3 = 33,33 (toFixed). 33,33 × 3 = 99,99 → toplam ana tutara eşit değil.
   Analiz 'tam olarak eşit' diyor."
   SEVERITY: P1-P2 · GUVEN: 8-10

2. **Float toplama hatası** — `reduce((a,b) => a+b, 0)`
   SENARYO: "19,99 × 3 → 59,96999999999999. Ekranda 59,97 görünse de karşılaştırma
   yapılırsa eşitlik tutmaz."

## Köprü kontrolü
Bulgulardan biri güven < 7 ile ayakta kalırsa `ANALISTE-GIDECEK.md`'da `(*)` işaretli senaryo doğmalı:
> "100 TL'yi 3 taksite bölün. Ekranda gösterilen taksitlerin toplamı 100 TL mi?"

Senaryoda `toFixed`, `float`, `reduce`, dosya adı **geçmemeli**.

## Analist paketi dil kontrolü  (KAPI 5.7 regresyonu)

Bu vaka aynı zamanda `ANALISTE-GIDECEK.md`'nın dilini sınar. Gerçek bir koşumda buradan teknik dil
sızmıştı; kontrolü altın vakaya bağlanmıştır.

`ANALISTE-GIDECEK.md` üretildikten sonra:

```bash
grep -nE '\.(ts|tsx|js|jsx)\b|[a-zA-Z_]+\(\)|```|\b(L[0-9]+-[0-9]+|P[123])\b|toFixed|reduce|float|Number\(' \
  dogrulama/<klasor>/ANALISTE-GIDECEK.md
```

**Hiçbir satır dönmemeli.**

Sağlık işaretlerinde beklenen:

```
GOREV: ANALIST
OKUNAN_KOD_DOSYASI: 0
TEKNIK_SIZINTI: 0
```

`OKUNAN_KOD_DOSYASI` sıfırdan büyükse ayrım çalışmamıştır — orkestratör `GOREV: ANALIST`
çağrısına kod yolu vermiştir. Bulgu senaryoyu değil, çağrıyı düzelt.

### Beklenen senaryo dili

| ✓ Böyle olmalı | ✗ Böyle olmamalı |
|---|---|
| "100 TL'yi 3 taksite bölün. Ekranda gösterilen taksitlerin toplamı 100 TL mi?" | "`taksitHesapla()` çıktısının toplamı `anaTutar`'a eşit mi?" |
| "Kuruş farkı oluşmamalı" | "Float yuvarlama hatası olmamalı" |

## Başarısız sayılır
- `toFixed` bulgusu üretilmezse
- Köprü senaryosu üretilmezse (güven < 7 olan ayakta bulgu varsa)
- `ANALISTE-GIDECEK.md` senaryosunda teknik terim geçerse
- `OKUNAN_KOD_DOSYASI: 0` veya `TEKNIK_SIZINTI: 0` sağlık işaretleri eksikse ya da
  sıfırdan büyükse
