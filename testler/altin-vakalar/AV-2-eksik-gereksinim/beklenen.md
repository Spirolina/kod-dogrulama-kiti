# Beklenen — AV-2

Test ettiği: RTM `❌` (eksik gereksinim), `dv-iz-denetci`.

## Üretilmesi gereken
- `R-01` (limit 50.000) → `✅`, `useLimitKontrol.ts:1`
- `R-02` (işlem başlatılamaz) → `✅`, `useLimitKontrol.ts:5`
- **`R-03` (kalan limit tutarını içeren uyarı) → `❌`** — mesaj sabit metin, kalan limit yok
- `❌` satırında nerelere bakıldığı yazılmış olmalı
- Sonuç dosyası **KAPANMADI** olmalı

## Başarısız sayılır
- `R-03` `✅` veya `⚠️` işaretlenirse
- A modunda `R-03` `❓` işaretlenirse (diff'in tamamı görüldü, "bulamadım" geçersiz)
