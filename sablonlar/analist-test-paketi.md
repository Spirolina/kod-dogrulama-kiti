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

`ANALISTE-GIDECEK.md` **kodu görmemiş bir bağlamda** yazılır (`dv-analist-paketi` agent'ı).
O agent'ın `tools` satırında `Grep` ve `Glob` yok — kod araması yapması teknik olarak
mümkün değil. Yasak değil, imkânsız.
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
  iki senaryodur (`MT-02`, `MT-03`). Bu kural §2b ile çelişmez: §2b sonucu **keskinleştirir**,
  ikinci bir sonuç eklemez.
- **Test verisi somut.** "Limiti dolu müşteri" değil, "Günlük limiti 50.000 TL olan, o gün
  45.000 TL göndermiş müşteri".
- **Hesap koşulu ayrı yazılır.** Hesabın sağlaması gereken şart `Hesap` kolonuna, adımdan
  önce gelen ekran durumu `Ön koşul` kolonuna. Karıştırma — §2c.
- **Negatif ve sınır zorunlu.** Her gereksinim için en az bir "olmaması gereken" senaryo,
  ve sınır değeri varsa tam sınırda bir senaryo. İnsanların atladığı yer tam burası.
- **Sıra bağımlılığı açık.** Bir senaryo öncekinin devamıysa `Ön koşul`'a yazılır
  ("MT-02'nin devamı").
- **Baş parmak testi.** Her adım, telefonu eline alan birinin yapabileceği bir hareket
  olmalı: dokun, yaz, bekle, kapat, geri dön. Yapılamıyorsa `SONUC.md` §3'ye taşınır.
- **Beklenen sonuç ekranda görünür olmalı.** "Limit düşürülür" bir iç durumdur, analist
  göremez. "Kalan limitiniz 5.000 TL olarak görünür" görülebilir.
- **Senaryo başına en fazla 5 adım.** Daha uzunu koşulmaz, koşulsa da nerede kırıldığı
  belli olmaz.
- **Müşteri akışı varyantı yalnız fark varsa çoğaltılır** — §2d.
- **Tekrar senaryo yok** — §2e.
- **Toplam 15 senaryoyu aşıyorsa** bu bir kapsam sinyalidir: değişiklik muhtemelen
  bölünmeli. Paketi kısaltma — `SONUC.md`'ye yaz ve söyle.
  Sayım **farklı** senaryoları sayar; akış varyantı çoğaltması ayrıca sayılmaz, yoksa
  sinyal anlamını kaybeder.

---

## 2b. Beklenen sonuç — üç parça

Analistlerden gelen en sık şikâyet: *"beklenen sonuç çok yüzeysel."* Haklılar. "Uyarı
görünür" cümlesi iki analiste iki farklı şey doğrulatır.

Ayrıntı **ikinci bir assert demek değil**, kesinlik demek. Yapı:

```
1. Ne görünür     : ekranda birebir görünecek metin / değer / durum
2. Nerede görünür : hangi ekran, hangi bölüm
3. Ne değişmemeli : bu adımda bozulmaması gereken şey   (yoksa "—")
```

```
✗  "Uyarı görünür."

✓  "Ödeme ekranında, tutar alanının hemen altında
    'Günlük limitinizi aşıyorsunuz' uyarısı görünür.
    Tutar alanına girdiğiniz 45.000 TL silinmez."
```

Üçüncü parça analistlerin ve otomasyonun en çok atladığı yer. Regresyonların çoğu
*"olması gereken oldu ama başka bir şey bozuldu"* biçiminde gelir: uyarı çıktı ama form
sıfırlandı, liste güncellendi ama seçim kayboldu.

**Uydurma yasak.** Değişmemesi gereken somut bir şey yoksa `—` yazılır. Uydurulmuş üçüncü
parça, koşmayan bir kontrol demektir.

Metin birebir bilinmiyorsa yaklaşık yaz ve bunu belli et: *"limit aşımını söyleyen bir
uyarı"*. Uydurulmuş birebir metin, ilk koşumda yanlış kırmızı üretir.

---

## 2c. Hesap koşulu ve koşum planı

Analist bir testi koşmak için önce uygun bir test hesabı bulmak zorunda. Bu **en pahalı
adım.** Paket bunu kolaylaştırmazsa testler koşulmaz.

İki şey ayrılır:

| Kolon | Ne yazılır | Örnek |
|---|---|---|
| `Hesap` | Hesabın sağlaması gereken şart — koşum planındaki anahtar | `bireysel-limit-dolu` |
| `Ön koşul` | Adım 1'den önceki ekran durumu | `MT-02'nin devamı`, `Android cihaz` |

Koşullar bir kez **koşum planı** tablosunda yazılır, satırlarda yalnız anahtar geçer.
Aynı koşulu isteyen senaryolar aynı anahtarı paylaşır ve analist tek hesapla arka arkaya
koşar.

Anahtar iş dilinde, küçük harf-tire: `bireysel-limit-dolu`, `tuzel-vadesi-gecmis`.
Özel koşul istemeyen senaryolar için `varsayilan`.

**Müşteri numarası kolonu BOŞ gider.** Kit asla değer yazmaz — müşteri numarası kişisel
veridir ve Confluence sayfasını sandığından çok daha fazla kişi görür. Analist kendi
seçtiği numarayı sayfada doldurur.

Aynı anahtar `ic/otomasyon-yargisi.md` ve `ortam-profili.local.json` içinde de kullanılır.
Tek sözlük, üç yüzey — ikinci bir hesap adlandırması kurulmaz.

---

## 2d. Müşteri akışı varyantları

`ic/analist-girdisi.md` içindeki "Müşteri akışı varyantları" tablosu neyin farklı
davrandığını söyler.

```
Analiz varyant ayırmıyor                -> tek senaryo
Analiz ayırıyor, davranış aynı          -> tek senaryo, hesap koşuluna varyant yaz
Analiz ayırıyor, DAVRANIŞ FARKLI        -> varyant başına ayrı senaryo
```

Her senaryoyu her varyant için tekrar yazmak **tekrar senaryonun kaynağıdır** ve
analistlerin şikâyet ettiği şeyin ta kendisi. Üç kat uzun paket, üç kat koşum, tek fark.

Varyant başına ayrı senaryo yazıldığında hesap anahtarı varyantı taşır:
`tuzel-limit-dolu` ile `bireysel-limit-dolu` ayrı satırlardır.

---

## 2e. Tekrar eleme

Paketi yazdıktan sonra, yayına vermeden önce koşulur.

```
İki senaryo AYNIDIR ancak ve ancak ÜÇÜ BİRDEN eşleşiyorsa:
    hesap koşulu   VE   adımlar   VE   beklenen sonuç

Biri farklıysa AYNI DEĞİLDİR — birleştirme:
    beklenen sonuç farklı   -> pozitif/negatif çifti, ikisi de kalır
    hesap koşulu farklı     -> sınır değeri ya da akış varyantı, ikisi de kalır
    adımlar farklı          -> ayrı yol, ikisi de kalır
```

Birleştirirken:

1. **`(*)` hayatta kalır.** Biri işaretliyse birleşik satır işaretlidir.
2. **Gereksinim kolonu ikisini de taşır:** `R-02, R-05`. Aksi halde bir gereksinim
   izlenebilirlik zincirinden düşer.
3. Daha somut test verisi olan metin kazanır.
4. Silinen `MT` numarası yeniden kullanılmaz. Numaralar ardışık kalsın diye yeniden
   numaralandırma da yapılmaz — kapsam beyanına `Birleştirilen: <n>` yazılır.

1. maddenin gerekçesi ince: köprüden gelen `(*)` senaryoları çoğu zaman mevcut bir
senaryonun aynısıdır. Birleşmede işaret düşerse o test KALDI olduğunda **yakalanan
defect kaçan sayılır** — §7'deki tek metrik sessizce bozulur.

Sağlık işaretine yaz: `BIRLESTIRILEN: <n>`.

**Elemede tereddüt varsa birleştirme.** Fazla senaryo maliyeti bir koşumdur; eksik
senaryo maliyeti canlıya çıkan bir hatadır.

## 3. Odak işareti `(*)`

Köprüden gelen senaryolar — doğrulamada şüpheli çıkmış ama statik olarak kanıtlanamamış
yerler (güven < 7). Analiste **neden** şüpheli olduğu söylenmez; teknik detay işine yaramaz
ve gereksiz endişe yaratır.

Eski sürümde pakete tek satır konuyordu ve analistler *"tam anlaşılmıyor"* dedi. Haklılar:
o satır ne yapılacağını değil, neye bakılacağını söylüyordu. Yerine şu blok konur:

```
h3. (*) işareti ne demek

Bu testler, paket hazırlanırken riskli bulunmuş noktalara denk geliyor.
Neden riskli olduğunu bilmenize gerek yok — bilmek dikkatinizi yanlış yere çeker.

Bu testlerde:
* Sayıları ekranda göründüğü gibi, hane hane karşılaştırın. "Yaklaşık doğru" yeterli değil.
* Beklenen sonucun "değişmemeli" kısmını da kontrol edin.
* KALDI ise Not kolonuna ne BEKLEDİĞİNİZİ değil, ne GÖRDÜĞÜNÜZÜ yazın.
* Ekran görüntüsü alıp Kanıt kolonuna ekleyin.

(*) bir test KALDI ise bu kötü haber değil: şüphemiz doğrulandı ve hata
canlıya çıkmadan yakalandı.
```

Son cümle isteğe bağlı değil. Onsuz `(*)` bir suçlama gibi okunur ve analist kırmızıyı
rapor etmekte tereddüt eder — kitin en çok işine yarayan sinyal tam orada kaybolur.

Yazarken dikkat: bu blok **ne yapılacağını** söyler, **neden** şüphelenildiğini asla.
"Yuvarlama hatası olabilir" yazmak yasaktır; "sayıları hane hane karşılaştırın" doğrudur.

## 3b. Yayın öncesi mekanik kontrol (zorunlu)

`ANALISTE-GIDECEK.md` yazıldıktan sonra, Confluence'a gitmeden önce **iki** kontrol koşulur.

### (1) Teknik sızıntı

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

Bu tarama **bölüm başlıklarını da kapsar.** Fonksiyonel alan başlıkları analiz
dokümanından geliyor ve analiz her zaman iş dilinde değil: `"Servis katmanı"`,
`"State yönetimi"` gibi bir başlık aynen kopyalanırsa doğrudan Confluence'a sızar.

Yanlış pozitif çıkabilir (özel isimler, ürün adları). Tek tek bak, körlemesine silme.

Sağlık işaretine yaz: `TEKNIK_SIZINTI: <n>` — **0 olmalı.**

### (2) Müşteri numarası

```bash
grep -nE '\b[0-9]{6,}\b' ANALISTE-GIDECEK.md
```

Müşteri numarası kolonu **boş** gitmeli. Uzun rakam dizisi ya gerçek bir müşteri
numarasıdır, ya da öyle görünen bir örnektir — ikisi de yayına çıkmaz.

Yanlış pozitif: büyük tutarlar. `50.000` nokta içerdiği için eşleşmez, `100000`
biçiminde yazılmış bir tutar eşleşir — onu `100.000` yap ve devam et.

Sağlık işaretine yaz: `MUSTERI_NO_YAZILDI: <n>` — **0 olmalı.**

İkisinden biri sıfır değilse `ANALISTE-GIDECEK.md` yayına hazır değildir.

## 4. Kapsam beyanı

Paketin en başına konur. Şu an hiçbir yerde olmayan ama en değerli bilgi: herkes
"test edildi" der, ne kadarının test edildiğini kimse bilmez.

```
Bu paket analiz dokümanındaki <n> gereksinimin <n>'sini kapsıyor.

Kapsanmayan:
  R-?? — <gereksinim özeti>. <neden kapsanmadı>, <nerede kontrol edildi>.

Toplam <n> senaryo · <n> negatif · <n> sınır değeri · <n> tanesi (*) işaretli.
Birleştirilen tekrar senaryo: <n>.
Bölümler: <n> fonksiyonel alan · Müşteri akışı: <n> varyant · Test hesabı: <n> farklı koşul.
```

`Birleştirilen` satırı boş geçilmez. `0` da bir cevaptır — eleme koşuldu, tekrar
çıkmadı demektir. Satırın hiç olmaması ise elemenin koşulmadığını gösterir.

## 5. `ANALISTE-GIDECEK.md` — Confluence wiki markup şablonu

Confluence'ta **Insert → Markup → Confluence Wiki** ile yapıştırılır; tablo olarak açılır.

Sayfanın iskeleti sabit ve sırası bağlayıcı:

```
1. Başlık ve kapsam beyanı
2. Gereksinimler tablosu        <- ne test ettiğimiz burada yazıyor
3. Koşum planı (hesaba göre)    <- hangi sırayla koşulacağı burada
4. (*) açıklaması
5. Fonksiyonel bölümler         <- senaryolar burada
```

2 ve 3 farklı sorulara cevap veriyor ve bu yüzden ayrılar: gereksinim tablosu
*"neyi doğruluyoruz"*, koşum planı *"hangi hesapla, hangi sırayla"*. Tek tabloya
sıkıştırmak ikisini de bozar.

```
h2. Test Paketi — <konu>

İlgili analiz: [<analiz sayfası adı>]
Hazırlayan: <ad> · Tarih: <YYYY-AA-GG>

Bu paket analiz dokümanındaki <n> gereksinimin <n>'sini kapsıyor.
Kapsanmayan: R-?? — <özet>. <neden>, <nerede kontrol edildi>.
Toplam <n> senaryo · <n> negatif · <n> sınır değeri · <n> tanesi (*) işaretli.
Birleştirilen tekrar senaryo: <n>.

h3. Gereksinimler

Test edilen davranışlar. Senaryo tablosundaki R kodları buraya işaret eder.

||ID||Gereksinim||
|R-01|<analiz dokümanından birebir>|
|R-02|<...>|

h3. Koşum planı

Bir test hesabı ayarlayın, o satırdaki tüm testleri arka arkaya koşun.
Müşteri no kolonunu siz doldurun.

||Hesap||Sağlaması gereken koşullar||Müşteri no||Testler||
|bireysel-limit-dolu|Bireysel müşteri. Günlük limiti 50.000 TL. O gün 45.000 TL göndermiş| |MT-01, MT-04, MT-09|
|tuzel-vadesi-gecmis|Tüzel müşteri. En az bir vadesi geçmiş faturası olan| |MT-05, MT-06|
|varsayilan|Özel koşul yok, herhangi bir aktif müşteri| |MT-02, MT-03|

h3. (*) işareti ne demek

Bu testler, paket hazırlanırken riskli bulunmuş noktalara denk geliyor.
Neden riskli olduğunu bilmenize gerek yok — bilmek dikkatinizi yanlış yere çeker.

Bu testlerde:
* Sayıları ekranda göründüğü gibi, hane hane karşılaştırın. "Yaklaşık doğru" yeterli değil.
* Beklenen sonucun "değişmemeli" kısmını da kontrol edin.
* KALDI ise Not kolonuna ne BEKLEDİĞİNİZİ değil, ne GÖRDÜĞÜNÜZÜ yazın.
* Ekran görüntüsü alıp Kanıt kolonuna ekleyin.

(*) bir test KALDI ise bu kötü haber değil: şüphemiz doğrulandı ve hata
canlıya çıkmadan yakalandı.

h3. <Fonksiyonel alan 1 — analiz dokümanının kendi başlığı>

||Test||Gereksinim||Hesap||Ön koşul||Adımlar||Beklenen sonuç||Odak||Sonuç||Kanıt||Not||
|MT-01|R-01|bireysel-limit-dolu|—|<numaralı adımlar>|<üç parça: ne / nerede / ne değişmemeli>| | | | |
|MT-04|R-01, R-05|bireysel-limit-dolu|MT-01'in devamı|<...>|<...>|(*)| | | |

h3. <Fonksiyonel alan 2>

||Test||Gereksinim||Hesap||Ön koşul||Adımlar||Beklenen sonuç||Odak||Sonuç||Kanıt||Not||
|MT-05|R-03|tuzel-vadesi-gecmis|—|<...>|<...>| | | | |

Sonuç kolonuna GEÇTİ / KALDI / KOŞULMADI yazınız.
KALDI ise Not kolonuna ne gördüğünüzü kısaca yazınız.
Kanıt kolonuna ekran görüntüsünü ekleyiniz — özellikle KALDI ve (*) satırlarında.
```

`Sonuç`, `Kanıt`, `Not` ve `Müşteri no` kolonları **boş gider**, analist sayfada doldurur.
Dosya gidip gelmez; Confluence sayfası canlı test kaydıdır.

**Kanıt kolonu iki yönlü çalışır:** analist elle koştuğunda kendi ekran görüntüsünü
yapıştırır; senaryo otomatik koşulduğunda developer koşum kanıtını buraya taşır
(`sablonlar/otomasyon-sozlesmesi.md` §9). Kanıt otomatik olarak **yüklenmez** — hangi
görüntünün paylaşılacağı insan kararıdır, görüntüde bakiye ve müşteri bilgisi vardır.

Sayfa adı: `DV-<YYYY-AA-GG>-<konu> Test Paketi`
Etiket: `dogrulama-test`
Konum: ilgili analiz sayfasının alt sayfası.

**Insert → Markup menüsü kapalıysa:** aynı tablo HTML olarak üretilir (`<table><tr><th>…`)
ve doğrudan yapıştırılır. İkisi de çalışmıyorsa düz numaralı metin listesi üretilir — bu
son çare, sonuç takibi elle yapılır ve RTM'e bağlamak zorlaşır.

**Tablo 10 kolon** ve dar ekranda yatay kayar. Analistler okunmaz bulursa ilk daraltma
`Odak` kolonunu kaldırıp işareti test koduna katmaktır: `MT-04 (*)`. O zaman
`ic/analist-sonuclari.md`'ye geri taşırken işaret elle ayrıştırılır — bu yüzden
varsayılan ayrı kolondur.

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

| Test | Gereksinim | Odak | Koşan | Sonuç | Kanıt | Not |
|---|---|---|---|---|---|---|
| MT-01 | R-01 | | OTOMAT | GEÇTİ | MT-01__gecti.png | |
| MT-07 | R-04 | (*) | ANALIST | KALDI | ekran-goruntusu-3.png | Taksit toplamı 33,33 yerine 33,32 çıktı |

Özet: <n> geçti · <n> kaldı · <n> koşulmadı · <n> birleştirilmiş senaryo
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
