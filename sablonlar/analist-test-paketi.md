# Analist Test Paketi — Şablon

Manuel testi **analistler** yapıyor, developer değil. Bu paket onlara gider ve
**Confluence**'ta yaşar. Bu iki gerçek biçimi belirliyor.

Üretilen üç dosya:

| Dosya | Kime | İçerik |
|---|---|---|
| `04a-analist-test-paketi.md` | analistlere (Confluence'a yapıştırılır) | iş dili, ekrandan yapılabilen adımlar |
| `04b-developer-kontrol-listesi.md` | developer'da kalır | DB/log doğrulamaları, teknik kontroller |
| `04c-test-sonuclari.md` | Confluence'tan geri kopyalanır | sonuçlar, RTM ve fişe işlenir |

---

## 1. Confluence'a ne gitmez

Kesin liste. Confluence sayfasını sandığından çok daha fazla kişi görür.

- `file:line` referansı, sınıf/metot adı, paket yolu
- Lens ID'si (`L2-01`), severity kodu (`P1`), güven puanı
- Ham bulgu metni, çürütme notu
- Branch adı, commit hash, PR linki
- Veritabanı tablo/kolon adı, sorgu, log formatı

Bunların hepsi `04b`'ye gider ve sende kalır.

## 2. Senaryo yazım kuralları

- **İş dili.** "Müşteri günlük limitini aşan bir transfer başlatır" — "TransferService
  limit kontrolünü çalıştırır" değil.
- **Ekrandan yapılabilir olmalı.** Analist veritabanına bakamaz, servis çağıramaz, log
  okuyamaz. Yapılamayan kontrol `04b`'ye taşınır.
- **Tek beklenen sonuç.** Bir senaryo bir şeyi doğrular. "Hem reddetsin hem mesaj göstersin"
  iki senaryodur (`MT-02`, `MT-03`).
- **Test verisi somut.** "Limiti dolu müşteri" değil, "Günlük limiti 50.000 TL olan, o gün
  45.000 TL göndermiş müşteri".
- **Negatif ve sınır zorunlu.** Her gereksinim için en az bir "olmaması gereken" senaryo,
  ve sınır değeri varsa tam sınırda bir senaryo. İnsanların atladığı yer tam burası.
- **Sıra bağımlılığı açık.** Bir senaryo öncekinin devamıysa ön koşulda yazılır ("MT-02'nin
  devamı").

## 3. Odak işareti `(*)`

Köprüden gelen senaryolar — doğrulamada şüpheli çıkmış ama statik olarak kanıtlanamamış
yerler (güven < 7). Analiste **neden** şüpheli olduğu söylenmez; teknik detay işine yaramaz
ve gereksiz endişe yaratır.

Paketin başına tek cümle konur:

> `(*)` işaretli testlerde sınır değerlere, tam sayılara ve tutarların toplamına özellikle
> dikkat edin.

## 4. Kapsam beyanı

Paketin en başına konur. Şu an hiçbir yerde olmayan ama en değerli bilgi: herkes
"test edildi" der, ne kadarının test edildiğini kimse bilmez.

```
Bu paket analiz dokümanındaki <n> gereksinimin <n>'sini kapsıyor.

Kapsanmayan:
  R-?? — <gereksinim özeti>. <neden kapsanmadı>, <nerede kontrol edildi>.

Toplam <n> senaryo · <n> negatif · <n> sınır değeri · <n> tanesi (*) işaretli.
(*) işaretli testlerde sınır değerlere, tam sayılara ve tutarların toplamına
özellikle dikkat edin.
```

---

## 5. `04a` — Confluence wiki markup şablonu

Confluence'ta **Insert → Markup → Confluence Wiki** ile yapıştırılır; tablo olarak açılır.

```
h2. Test Paketi — <konu>

İlgili analiz: [<analiz sayfası adı>]
Hazırlayan: <ad> · Tarih: <YYYY-AA-GG>

Bu paket analiz dokümanındaki <n> gereksinimin <n>'sini kapsıyor.
Kapsanmayan: R-?? — <özet>. <neden>, <nerede kontrol edildi>.
Toplam <n> senaryo · <n> negatif · <n> sınır değeri · <n> tanesi (*) işaretli.
(*) işaretli testlerde sınır değerlere, tam sayılara ve tutarların toplamına
özellikle dikkat edin.

||Test||Gereksinim||Ön koşul / Veri||Adımlar||Beklenen sonuç||Odak||Sonuç||Not||
|MT-01|R-01|<somut ön koşul ve test verisi>|<numaralı adımlar>|<tek beklenen sonuç>| | | |
|MT-02|R-02|<...>|<...>|<...>| | | |
|MT-04|R-01|<...>|<...>|<...>|(*)| | |

Sonuç kolonuna GEÇTİ / KALDI / KOŞULMADI yazınız.
KALDI ise Not kolonuna ne gördüğünüzü kısaca yazınız.
```

`Sonuç` ve `Not` kolonları **boş gider**, analist sayfada doldurur. Dosya gidip gelmez;
Confluence sayfası canlı test kaydıdır.

Sayfa adı: `DV-<YYYY-AA-GG>-<konu> Test Paketi`
Etiket: `dogrulama-test`
Konum: ilgili analiz sayfasının alt sayfası.

**Insert → Markup menüsü kapalıysa:** aynı tablo HTML olarak üretilir (`<table><tr><th>…`)
ve doğrudan yapıştırılır. İkisi de çalışmıyorsa düz numaralı metin listesi üretilir — bu
son çare, sonuç takibi elle yapılır ve RTM'e bağlamak zorlaşır.

---

## 6. `04b` — Developer kontrol listesi şablonu

Analistin göremeyeceği her şey burada. Sende kalır, Confluence'a gitmez.

```markdown
# Developer Kontrol Listesi — <konu>

| # | Bağlı test | Ne kontrol edilecek | Nerede | Sonuç |
|---|---|---|---|---|
| DK-01 | MT-02 | Limit düşüşü kaydedildi mi | <tablo/kolon> | |
| DK-02 | MT-02 | Reddedilen işlem için kayıt oluşmadı mı | <tablo> | |
| DK-03 | MT-07 | Taksit toplamı = ana tutar | <tablo> | |
| DK-04 | — | Hata log'unda PII geçmiyor mu | <log> | |
| DK-05 | MT-03 | Hata kodu üretildi mi, izlenebilir mi | <log> | |

Bağlı bulgular: <L?-??> — bu kontrol o bulgunun çalıştırma kanıtıdır.
```

Kural: `04b`'deki her satır ya bir `MT-xx`'in tamamlayıcısıdır, ya da analistin hiç
yapamayacağı bağımsız bir kontroldür. Sebepsiz teknik kontrol eklenmez.

---

## 7. `04c` — Geri dönüş şablonu

Analist Confluence tablosunu doldurduktan sonra kopyalanır.

```markdown
# Test Sonuçları — <konu>
Kaynak: <confluence linki> · Alındığı tarih: <YYYY-AA-GG>

| Test | Gereksinim | Odak | Sonuç | Not |
|---|---|---|---|---|
| MT-01 | R-01 | | GEÇTİ | |
| MT-07 | R-04 | (*) | KALDI | Taksit toplamı 33,33 yerine 33,32 çıktı |

Özet: <n> geçti · <n> kaldı · <n> koşulmadı
```

Sonuçlar iki yere işlenir:

1. **RTM** — ilgili gereksinimin "manuel adım" kolonu güncellenir
2. **Fiş** — "Manuel test" bölümü doldurulur

**`(*)` işaretli bir test KALDI ise:** doğrulamanın şüphesi doğrulanmıştır. Bu **kaçan
defect değil, yakalanan defect'tir** — `kacan-defectler.md`'ye değil, fişin başarı hanesine
yazılır. Köprünün çalıştığının kanıtıdır.

**`(*)` işaretsiz bir test KALDI ise:** hiçbir lens bunu öngörmemiştir.
`kacan-defectler.md`'ye yazılır ve sorulur: *hangi lens kaçırdı?* Cevap ya mevcut bir lense
yeni kontrol maddesi, ya yeni bir lens olur — ve beraberinde bir altın vaka gelir.
