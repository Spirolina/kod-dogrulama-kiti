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
Bulgulardan biri güven < 7 ile ayakta kalırsa `04a`'da `(*)` işaretli senaryo doğmalı:
> "100 TL'yi 3 taksite bölün. Ekranda gösterilen taksitlerin toplamı 100 TL mi?"

Senaryoda `toFixed`, `float`, `reduce`, dosya adı **geçmemeli**.

## Başarısız sayılır
- `toFixed` bulgusu üretilmezse
- Köprü senaryosu üretilmezse (güven < 7 olan ayakta bulgu varsa)
- `04a` senaryosunda teknik terim geçerse
