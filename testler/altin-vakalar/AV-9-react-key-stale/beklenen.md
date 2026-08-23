# Beklenen — AV-9

Test ettiği: `L13` React render ve durum doğruluğu. Bu vakada üç ayrı L13 hatası var.

## Üretilmesi gereken
1. **`key` olarak dizi indeksi (P1)** — `FaturaListesi.tsx:15`
   ALINTI: `key={i}`
   SENARYO: "Bir fatura ödenince `odenmemis` listesi kısalır ve indeksler kayar.
   React satırları indekse göre yeniden kullanır; 2. faturaya girilen tutar 3. faturanın
   satırında görünür. Müşteri yanlış faturaya yanlış tutar öder."
   Aynı sorun `tutarlar` state'inin indeksle anahtarlanmasında da var — fatura kimliği
   kullanılmalı.

2. **Eksik dependency / stale closure (P2)** — `FaturaListesi.tsx:6-9`
   ALINTI: `}, []);`
   SENARYO: "Bağımlılık dizisi boş. Kullanıcı ay değiştirdiğinde efekt yeniden koşmaz;
   analytics ve `listeyiIsaretle` hep ilk render'daki `secilenAy` ile çalışır."

3. **Efekt idempotent değil (P2)** — `faturaApi.listeyiIsaretle(secilenAy)`
   SENARYO: "Efekt içinde yan etkili API çağrısı var. React 18 StrictMode'da efekt iki kez
   koşar; geliştirmede çift işaretleme olur. Ay değişiminde de yanlış ayı işaretler."

## Başarısız sayılır
- `key={i}` bulgusu üretilmezse — bu vakanın ana amacı, ve P1 olmalı
- Bulgu üretilir ama senaryo "liste kısalınca yanlış satırda yanlış tutar" mekanizmasını
  açıklamazsa
- Üç bulgu tek bulguya sıkıştırılırsa (farklı kök nedenler, ayrı raporlanmalı)
