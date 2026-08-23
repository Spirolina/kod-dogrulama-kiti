# Beklenen — AV-7

Test ettiği: **B modu kapsam keşfi**, `dv-iz-denetci GOREV: KAPSAM`.
Diff verilmez, sadece analiz + kod klasörü.

## Kapsam haritasında bulunması gerekenler
| Dosya | Rol | Neden |
|---|---|---|
| `screens/TransferEkrani.tsx` | giriş noktası | akış buradan başlıyor |
| `hooks/useLimitKontrol.ts` | iş kuralı | limit karşılaştırması burada |
| `api/transferApi.ts` | veri erişimi | günlük toplam buradan geliyor |
| `config/limits.ts` | config | R-03'ün karşılığı, limit değeri burada |

`config/limits.ts` en kritik olanı: dosya adı `limit` içerdiği için isim aramasıyla
bulunabilir, ama asıl bağlantı `LIMITLER.gunlukTransfer` sembolü ve `50000` sabiti üzerinden
kurulur. Tek arama yolu koşan agent ya dosyayı bulur ama R-03 ile bağlantısını kuramaz,
ya da hiç bulamaz. Vakanın amacı bu.

## Hariç tutulması gereken
- `screens/HesapOzeti.tsx` — analizle ilgisiz. `DAHİL ETMEDİKLERİM` altında gerekçesiyle.

## Ayrıca
- `## Arama izi` üç yolun da koşulduğunu göstermeli (`Arama yolu: 3/3`)
- Çıktı `KAPSAM ONAYI BEKLENİYOR` ile bitmeli, RTM üretilmemeli
- `EMİN OLAMADIKLARIM` boş bırakılmamalı (`yok` yazılabilir)
- `tekIslem` limiti analizle ilgisiz — dahil edilirse gerekçesi olmalı

## Başarısız sayılır
- `config/limits.ts` kaçarsa → R-03 yanlışlıkla `❓`/`❌` olur
- `HesapOzeti.tsx` kapsama girerse → gereksiz tarama
- Agent onay beklemeden RTM üretirse → onay durağı çalışmıyor
