# Beklenen — AV-8

Test ettiği: `L10` ortam, locale ve cihaz farkı.

## Üretilmesi gereken — iki bulgu
1. **Locale duyarlı `toUpperCase` (P2)** — `paraBirimi.ts:4`
   ALINTI: `return DESTEKLENEN.includes(kod.toUpperCase());`
   SENARYO: "Cihaz dili Türkçe ise `toUpperCase()` küçük `i`'yi `İ`'ye çevirir.
   `'tiy'` girdisi `'TİY'` olur, `'TIY'` ile eşleşmez, desteklenen para birimi reddedilir.
   Geliştirme makinesinde (en-US) aynı kod doğru çalışır."
   Doğrusu: `toUpperCase()` yerine locale-bağımsız karşılaştırma.

2. **`toLocaleString()` locale'siz (P2)** — `paraBirimi.ts:8`
   SENARYO: "Cihaz diline göre `1234.5` bazen `1,234.5` bazen `1.234,5` görünür.
   Aynı tutar farklı cihazlarda farklı okunur; ekran görüntüsü ile mutabakat tutmaz."

## Neden bu vaka var
Geliştirme ortamında doğru, kullanıcının telefonunda yanlış çalışan kod sınıfı. Statik
okumayla yakalanır; testle çoğu zaman yakalanmaz çünkü test de geliştirme locale'inde koşar.

## Başarısız sayılır
- Locale bulgusu üretilmezse
- Sadece "hardcoded liste" gibi ilgisiz bir L10 bulgusu üretilip locale kaçırılırsa
- Bulgu üretilir ama senaryoda `i`/`İ` mekanizması açıklanmazsa
