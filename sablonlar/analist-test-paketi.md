# Analist Test Paketi — Şablon

Manuel testi **analistler** yapıyor, developer değil. Bu paket onlara gider ve
**Confluence**'ta yaşar. Bu iki gerçek biçimi belirliyor.

Üretilen üç dosya:

| Dosya | Kime | İçerik |
|---|---|---|
| `ANALISTE-GIDECEK.md` | analistlere (Confluence'a yapıştırılır) | iş dili, ekrandan yapılabilen adımlar |
| `ic/developer-kontrolleri.md` | developer'da kalır | DB/log doğrulamaları, teknik kontroller |
| `ic/analist-sonuclari.md` | Confluence'tan geri kopyalanır | sonuçlar, RTM ve `SONUC.md`'ye işlenir |

---

## 0. `ANALISTE-GIDECEK.md`'yı kim yazar — ve neden ayrı

`ANALISTE-GIDECEK.md` **kodu görmemiş bir bağlamda** yazılır (`dv-iz-denetci` · `GOREV: ANALIST`).
Girdisi yalnız: analiz dokümanı, çivilenmiş gereksinimler, RTM durumları ve köprüden
gelen **iş dilindeki** senaryolar. Dosya adı, kod, bulgu metni o bağlama hiç girmez.

Sebep: bu ilk sürümde `ANALISTE-GIDECEK.md` RTM ile aynı geçişte yazılıyordu ve yasak listesine rağmen
teknik dil sızıyordu. Az önce her dosyayı okumuş bir bağlama "kod dilinde yazma" demek
işe yaramıyor — hatırladığı dil o. **Görmediğini sızdıramaz;** çözüm kural değil, ayrım.

## 1. Confluence'a ne gitmez

Kesin liste. Confluence sayfasını sandığından çok daha fazla kişi görür.

- `file:line` referansı, sınıf/metot/değişken adı, paket yolu, dosya uzantısı
- **Kod parçası.** Tek satır bile. Backtick içinde bile.
- Lens ID'si (`L2-01`), severity kodu (`P1`), güven puanı
- Ham bulgu metni, çürütme notu
- Branch adı, commit hash, PR linki
- API yolu, HTTP durum kodu, köprü metot adı, MFE adı
- Veritabanı tablo/kolon adı, sorgu, log formatı
- Tarayıcı/platform API'si (`localStorage`, `WebView`, `window`, `useEffect`)

Bunların hepsi `SONUC.md` §3'ye gider ve sende kalır.

## 1b. Dil dönüşüm tablosu

Yasak listesi tek başına yetmiyor — **yerine ne yazılacağı** söylenmeli. Teknik gerçek
korunur, dili değişir:

| Teknik gerçek | `ANALISTE-GIDECEK.md`'da böyle yazılır |
|---|---|
| Servis 500 dönerse | Sistem yanıt vermezse |
| İstek zaman aşımına uğrarsa | İşlem uzun sürer ve tamamlanmazsa |
| Oturum bilgisi depodan okunamıyorsa | Uygulama oturumu devralamazsa |
| Ekran yeniden yükleniyor / bağlam sıfırlanıyor | Ekran baştan açılıyor |
| Ondalık yuvarlama hatası | Kuruş farkı oluşması |
| Aynı isteğin iki kez gitmesi | Butona iki kez basılması |
| Tekrar koruması yok | Aynı işlemin iki kez oluşması |
| Durum saklanmıyor | Girilen bilgilerin kaybolması |
| Farklı bölüme geçişte bağlam kopuyor | Başka bir sekmeye gidip geri dönme |
| Büyük/küçük harf dönüşümü dile duyarlı | Türkçe karakterli metin girilmesi |
| İzin reddedilirse akış devam ediyor | İzin isteğinde "İzin verme" seçilmesi |
| Sınır karşılaştırması yanlış | Tutarın tam olarak limite eşit olması |

Kural: analistin **ekranda görebileceği** ya da **eliyle yapabileceği** bir şeye çevir.
Çeviremiyorsan o senaryo `ANALISTE-GIDECEK.md`'ya ait değildir — `SONUC.md` §3'ye taşı ve kapsam beyanında
kapsanmayan olarak yaz.

## 1c. Önce / sonra

Gerçek koşumdan çıkmış tipik sızıntılar ve doğrusu:

| ✗ Böyle yazılmış | ✓ Böyle yazılmalı |
|---|---|
| `useLimitKontrol` hook'u limit aşımında hata mesajı döndürmeli | Günlük limitini aşan bir transfer denendiğinde uyarı mesajı görünmeli |
| `taksitHesapla()` fonksiyonunun döndürdüğü dizinin toplamı ana tutara eşit olmalı | Taksitlerin toplamı, kredinin ana tutarıyla kuruşu kuruşuna aynı olmalı |
| `localStorage`'da `auth_token` yoksa `/login`'e yönlendiriyor | Kredilerim bölümüne girildiğinde yeniden şifre sorulmamalı |
| Köprü çağrısı `catch` bloğunda `true` dönüyor (fail-open) | Cihaz güvenlik kontrolü tamamlanamazsa işleme devam edilmemeli |
| API 500 dönerse boş liste render ediliyor | Sistem yanıt vermediğinde "hesaplarınız yüklenemedi" benzeri bir hata görünmeli, boş liste değil |
| `key={i}` kullanıldığı için liste yeniden sıralandığında satırlar karışıyor | Listeyi sıraladıktan sonra satırlardaki bilgiler doğru satırda kalmalı |

Sağdaki sütunda ne dosya adı var, ne fonksiyon, ne de "neden şüpheleniyoruz". Analistin
ihtiyacı olan tek şey: **ne yapacağım, ne görmeliyim.**

## 2. Senaryo yazım kuralları

- **İş dili.** "Müşteri günlük limitini aşan bir transfer başlatır" — "TransferService
  limit kontrolünü çalıştırır" değil.
- **Ekrandan yapılabilir olmalı.** Analist veritabanına bakamaz, servis çağıramaz, log
  okuyamaz. Yapılamayan kontrol `SONUC.md` §3'ye taşınır.
- **Tek beklenen sonuç.** Bir senaryo bir şeyi doğrular. "Hem reddetsin hem mesaj göstersin"
  iki senaryodur (`MT-02`, `MT-03`).
- **Test verisi somut.** "Limiti dolu müşteri" değil, "Günlük limiti 50.000 TL olan, o gün
  45.000 TL göndermiş müşteri".
- **Negatif ve sınır zorunlu.** Her gereksinim için en az bir "olmaması gereken" senaryo,
  ve sınır değeri varsa tam sınırda bir senaryo. İnsanların atladığı yer tam burası.
- **Sıra bağımlılığı açık.** Bir senaryo öncekinin devamıysa ön koşulda yazılır ("MT-02'nin
  devamı").
- **Baş parmak testi.** Her adım, telefonu eline alan birinin yapabileceği bir hareket
  olmalı: dokun, yaz, bekle, kapat, geri dön. Yapılamıyorsa `SONUC.md` §3'ye taşınır.
- **Beklenen sonuç ekranda görünür olmalı.** "Limit düşürülür" bir iç durumdur, analist
  göremez. "Kalan limitiniz 5.000 TL olarak görünür" görülebilir.
- **Senaryo başına en fazla 5 adım.** Daha uzunu koşulmaz, koşulsa da nerede kırıldığı
  belli olmaz.
- **Toplam 15 senaryoyu aşıyorsa** bu bir kapsam sinyalidir: değişiklik muhtemelen
  bölünmeli. Paketi kısaltma — `SONUC.md`'ye yaz ve söyle.

## 3. Odak işareti `(*)`

Köprüden gelen senaryolar — doğrulamada şüpheli çıkmış ama statik olarak kanıtlanamamış
yerler (güven < 7). Analiste **neden** şüpheli olduğu söylenmez; teknik detay işine yaramaz
ve gereksiz endişe yaratır.

Paketin başına tek cümle konur:

> `(*)` işaretli testlerde sınır değerlere, tam sayılara ve tutarların toplamına özellikle
> dikkat edin.

## 3b. Yayın öncesi mekanik kontrol (zorunlu)

`ANALISTE-GIDECEK.md` yazıldıktan sonra, Confluence'a gitmeden önce koşulur:

```bash
grep -nE '\.(ts|tsx|js|jsx|swift|kt|java)\b|[a-zA-Z_]+\(\)|```|\b(L[0-9]+-[0-9]+|P[123])\b|/api/|https?://|localStorage|sessionStorage|WebView|window\.|use[A-Z][a-zA-Z]+|[a-z]+[A-Z][a-zA-Z]*' ANALISTE-GIDECEK.md
```

**Hiçbir satır dönmemeli.** Dönen her satır elden geçirilir:

| Eşleşme | Ne yapılır |
|---|---|
| Dosya uzantısı, `fonksiyonAdı()`, camelCase | Dil dönüşüm tablosuna göre çevir |
| Kod bloğu (```` ``` ````) | Tamamen sil, ne yapıldığını cümleyle anlat |
| Lens/severity kodu | Sil, `SONUC.md` §3'ye taşı |
| URL, API yolu | Sil |
| Platform API adı | Dil dönüşüm tablosuna göre çevir |

Yanlış pozitif çıkabilir (özel isimler, ürün adları). Tek tek bak, körlemesine silme.

Sağlık işaretine yaz: `TEKNIK_SIZINTI: <n>` — **0 olmalı.** Sıfır değilse `ANALISTE-GIDECEK.md` yayına
hazır değildir.

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

## 5. `ANALISTE-GIDECEK.md` — Confluence wiki markup şablonu

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

## 6. `ic/developer-kontrolleri.md` — Developer kontrol listesi şablonu

Analistin göremeyeceği her şey burada. Sende kalır, Confluence'a gitmez.
Bu tablo `SONUC.md` §3'e olduğu gibi taşınır — developer tek dosyada görsün diye.

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

Kural: `SONUC.md` §3'deki her satır ya bir `MT-xx`'in tamamlayıcısıdır, ya da analistin hiç
yapamayacağı bağımsız bir kontroldür. Sebepsiz teknik kontrol eklenmez.

---

## 7. `ic/analist-sonuclari.md` — Geri dönüş şablonu

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
2. **`SONUC.md`** — §4 "Manuel test" bölümü doldurulur

**`(*)` işaretli bir test KALDI ise:** doğrulamanın şüphesi doğrulanmıştır. Bu **kaçan
defect değil, yakalanan defect'tir** — `kacan-defectler.md`'ye değil, sonucun başarı hanesine
yazılır. Köprünün çalıştığının kanıtıdır.

**`(*)` işaretsiz bir test KALDI ise:** hiçbir lens bunu öngörmemiştir.
`kacan-defectler.md`'ye yazılır ve sorulur: *hangi lens kaçırdı?* Cevap ya mevcut bir lense
yeni kontrol maddesi, ya yeni bir lens olur — ve beraberinde bir altın vaka gelir.
