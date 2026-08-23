# Altın Vakalar

Workflow'un kendi testi. Her vaka: bilerek konmuş bir tohum + sahte analiz + beklenen sonuç.
Hedef mimari: **her MFE ayrı WebView'da** çalışan React uygulamaları. Native kabuk kapsam dışı —
bulgular her zaman bizim kodumuzda olmalı.

**Ne zaman koşulur:** `sablonlar/lens-paketi.md` her değiştiğinde, agent tanımları
güncellendiğinde, yeni lens/kontrol maddesi eklendiğinde.

**Nasıl koşulur:**
1. Yeni Claude Code oturumu (`/clear`)
2. `/dv-dogrula` — analiz: vakanın `analiz.md`'si, kapsam: `kod/` klasörü
3. Çıktıyı `beklenen.md` ile karşılaştır

| Vaka | Test ettiği | Lens / bileşen |
|---|---|---|
| AV-1 | `➕` gereksinimsiz kod + PII analytics | `dv-iz-denetci`, L6 |
| AV-2 | `❌` eksik gereksinim | `dv-iz-denetci` |
| AV-3 | Sınır değeri (`<` vs `<=`) | L1 |
| AV-4 | JS float / `toFixed` + **köprü** | L2, `GOREV:KOPRU` |
| AV-5 | Köprü fail-open + platform kontrolü yok | L14, L11, L5 |
| AV-6 | **Yanlış pozitif eleme** | `dv-curutucu` |
| AV-7 | **B modu kapsam keşfi** | `GOREV:KAPSAM` |
| AV-8 | Türkçe locale tuzağı | L10 |
| AV-9 | `key={i}` + stale closure + idempotent olmayan efekt | L13 |
| AV-10 | Oturum temelsiz varsayımla depodan okunuyor | L15, L6, L5 |
| AV-11 | Sıfırdan yüklemede çok adımlı akış baştan başlıyor | L15, L3, L16 |

**Kural:** lens paketine yeni kontrol maddesi eklendiğinde beraberinde bir altın vaka gelir.
Yoksa eklemenin işe yaradığı hiçbir zaman doğrulanmaz.

**AV-6 en değerlisi** — sistemin *yanlış alarm vermediğini* test eden tek vaka. Kod doğrudur;
bulgu üretilirse çürütülmesi beklenir. Ayakta kalırsa sistem yanlış pozitif üretiyor demektir.

## Lens kapsama durumu

Kapsanan: L1 L2 L3 L5 L6 L10 L11 L13 L14 L15 L16
Kapsanmayan: **L4 L7 L8 L9 L12** — bunlar için vaka yok.
Pilot sırasında bu lenslerden bulgu gelmezse önce vaka yazıp lensi doğrula, sonra
"temiz" sonucuna güven.
