# Beklenen — AV-13

Test ettiği: **`dv-analist-paketi`** — tekrar eleme (§2e), akış varyantı (§2d),
bölümleme, gereksinim tablosu, koşum planı, üç parçalı beklenen sonuç.

Diğer vakalar *bulmayı* (AV-1…AV-11) ve *karar vermeyi* (AV-12) test ediyor. Bu vaka
**elemeyi** test ediyor.

Elemenin başarısızlık biçimi diğerlerinden farklı ve daha sinsi: paket **kısalır ve
tertemiz görünür.** Kaybolan senaryonun yerinde bir boşluk kalmaz.

---

## 1. Gereksinim tablosu — atlanamaz

Pakette `h3. Gereksinimler` bölümü olmalı ve dokuz gereksinimin metni **analizden birebir**
bulunmalı.

**Kalır:** tablo hiç yoksa, ya da metinler özetlenmişse ("kart bilgileri gösterilir"
gibi). Analistlerin şikâyeti tam buydu: `R-01` tek başına hiçbir şey söylemiyor.

Sağlık işareti: `GEREKSINIM_TABLOSU: var`.

---

## 2. Bölümleme — analizin kendi başlıkları

Analiz üç başlık taşıyor. Paket **tam olarak bu üç bölümü** üretmeli:

| Beklenen bölüm | Hangi gereksinimler |
|---|---|
| Kart görünümü | R-01, R-02, R-03 |
| Limit ve harcama | R-04, R-05, R-06, R-07 |
| Hata durumları | R-08, R-09 |

`FONKSIYONEL_BOLUM: 3`.

**Kalır:** uydurulmuş kategori çıkarsa ("Doğrulama", "Kullanıcı deneyimi"), ya da
bölümleme hiç yapılmazsa. Analiz zaten bölünmüş; onu kullanmamak için sebep yok.

**Kalır:** başlık teknik dile kayarsa. Buradaki üç başlık zaten iş dilinde, dolayısıyla
bu koşumda çeviri gerekmiyor — çevirmeye kalkarsa da kalır.

---

## 3. Akış varyantı — asıl tuzak

Analiz iki müşteri türü tanımlıyor ve **tek farkı** söylüyor: R-03.

Beklenen: `AKIS_VARYANTI: 2`, ve **yalnız R-03 için** varyant başına ayrı senaryo.
Diğer sekiz gereksinim tek senaryo.

```
DOĞRU:   R-03 -> 2 senaryo (bireysel: firma adı görünmez / tüzel: görünür)
         R-01, R-02, R-04..R-09 -> her biri tek senaryo

YANLIŞ:  9 gereksinim x 2 varyant = 18 senaryo
```

**Kalır:** her senaryo iki kez yazılırsa. Analistlerin *"bazı senaryolar birbirinin
aynısı"* şikâyetinin birinci kaynağı budur.

Dikkat — bu tuzağı **tekrar eleme yakalayamaz.** İki varyant senaryosunun hesap koşulu
farklıdır (`bireysel-*` / `tuzel-*`), dolayısıyla §2e'nin üçlü eşleşmesi tutmaz ve ikisi
de hayatta kalır. Tek savunma §2d'dir, kaynağında.

Bu ayrım vakanın var olma sebeplerinden biri: iki ayrı mekanizma, iki ayrı tuzak.

---

## 4. Tekrar eleme — köprü senaryosu

`KartDetay.tsx` içinde `setTutar('')` var; R-06 *"Girilen tutar alanda korunacaktır"*
diyor. Kod tersini yapıyor.

Bulgu güveni 7'nin altında kalırsa köprüden bir `K-xx` doğar ve şuna benzer:
*"Limiti aşan bir tutar girin. Hata mesajından sonra tutar alanında yazdığınız değer
duruyor mu?"*

Bu, R-06'nın kendi negatif senaryosuyla **birebir aynıdır**: aynı hesap koşulu, aynı
adımlar, aynı beklenen sonuç. Üçlü eşleşme tam.

Beklenen: **birleşirler.** Ve birleşen satır:

| Kontrol | Beklenen |
|---|---|
| `Odak` kolonu | `(*)` — köprüden geliyor |
| `Gereksinim` kolonu | `R-06` (tek gereksinim, ikisi de ona bağlı) |
| Kapsam beyanı | `Birleştirilen: 1` (en az) |

**Kalır:** iki ayrı satır olarak durursa — analistler aynı testi iki kez koşar.

**Kalır — ve bu daha kötüsü:** birleşir ama `(*)` düşerse. O test KALDI olduğunda
**yakalanan defect kaçan sayılır.** `SONUC.md` §4'teki tek metrik sessizce bozulur ve
köprünün çalıştığı hiçbir yerde görünmez.

---

## 5. Sahte tekrarlar — birleşMEmeli

Üç çift var. Hiçbiri birleşmemeli.

| Çift | Neden ayrı |
|---|---|
| R-05 (`limit 0 -> "Limitiniz doldu"`) ile R-06 (`limit aşımı -> "Limit yetersiz"`) | Beklenen sonuç farklı |
| R-06 (limiti **aşan** tutar) ile R-07 (limite **tam eşit** tutar) | Test verisi ve beklenen sonuç farklı — biri red, biri kabul |
| R-03 bireysel ile R-03 tüzel | Hesap koşulu farklı, analiz farklı davranış tarif ediyor |

**Kalır:** biri bile birleşirse. Özellikle ikinci çift: sınır senaryosunu yutan bir
eleme, kitin en çok değer verdiği senaryo türünü siler.

Kural hatırlatması: üçünden **biri** farklıysa aynı değildir.

---

## 6. Koşum planı ve hesap koşulu

`h3. Koşum planı` bölümü olmalı, dört kolonlu:
`Hesap | Sağlaması gereken koşullar | Müşteri no | Testler`.

Beklenen anahtarlar (adlandırma birebir olmak zorunda değil, ayrım olmalı):

| Anahtar | Koşul | Hangi testler |
|---|---|---|
| `varsayilan` | Özel koşul yok | R-01, R-02, R-08 senaryoları |
| `bireysel-kart-sahibi` | Bireysel müşteri, en az bir kartı olan | R-03 bireysel |
| `tuzel-kart-sahibi` | Tüzel müşteri, firmaya bağlı kartı olan | R-03 tüzel |
| `limit-sifir` | Kalan limiti 0 olan kartı olan | R-05 |
| `limit-dolu-degil` | Kalan limiti bilinen, sıfırdan büyük kart | R-04, R-06, R-07 |

`HESAP_KOSULU` bu satır sayısına eşit.

### Müşteri no kolonu BOŞ

**Kalır:** herhangi bir değer yazılırsa — gerçek numara da, `12345678` gibi örnek de.

Sağlık işareti: `MUSTERI_NO_YAZILDI: 0`. §3b'nin ikinci `grep`'i (`[0-9]{6,}`) koşulmuş
olmalı.

Bu satır kişisel veri kapısı: Confluence sayfasını sandığından çok daha fazla kişi görür
ve oradan geri alınamaz.

### Ön koşul ile hesap koşulu karışmamalı

`Hesap` kolonunda hesabın şartı, `Ön koşul` kolonunda ekran durumu.

**Kalır:** "Kalan limiti 0 olan kart" ifadesi `Ön koşul`'a yazılırsa. O zaman koşum planı
boşalır ve analist yine her testte hesap arar — maddenin çözdüğü sorun geri gelir.

---

## 7. Beklenen sonuç — üç parça

R-06'nın senaryosu bu vakanın en iyi örneği, çünkü üçüncü parça **analizde açıkça yazıyor**
ve kodda **bozuk**.

```
✗  "Limit yetersiz mesajı görünür."

✓  "Kart detayında 'Limit yetersiz' mesajı görünür.
    Tutar alanına girdiğiniz değer silinmez."
```

İkinci cümle olmadan senaryo, `setTutar('')` hatasını **yakalayamaz** — mesaj çıkıyor,
test geçiyor, hata canlıya gidiyor.

**Kalır:** üçüncü parça R-06'da yoksa. Analiz onu açıkça söylüyor; atlanması eleme değil
körlüktür.

Aynı beklenti R-09'da: *"Kartın diğer bilgileri görünmeye devam edecektir"* — bu da bir
"ne değişmemeli".

**Kalır:** üçüncü parça uydurulursa. R-01 gibi doğal karşılığı olmayan senaryolarda `—`
yazılmalı. Uydurulmuş "değişmemeli" koşmayan bir kontrol demektir.

---

## 8. Sağlık işaretleri

```
OKUNAN_KOD_DOSYASI: 0
GEREKSINIM_TABLOSU: var
FONKSIYONEL_BOLUM: 3
AKIS_VARYANTI: 2
HESAP_KOSULU: 5
BIRLESTIRILEN: >= 1
TEKNIK_SIZINTI: 0
MUSTERI_NO_YAZILDI: 0
```

`BIRLESTIRILEN` satırının **hiç olmaması** ile `0` olması aynı şey değil. Birincisi
elemenin koşulmadığını, ikincisi koşulup tekrar bulunmadığını söyler. Bu vakada `0`
da kalır — köprü senaryosu birleşmeliydi.

---

## İkinci koşum — başlıksız analiz

Aynı vakayı, `analiz.md`'deki üç `## ` başlığını silip gereksinimleri düz liste yaparak
koş.

Beklenen: bölümleme **yapılmaz**, tek tablo çıkar, `FONKSIYONEL_BOLUM: 1`, ve
`ic/analist-girdisi.md`'de "analizde başlık yok" notu bulunur.

**Kalır:** kategori uydurursa. Sabit bir kategori listesi (`hata durumları`,
`kart görünümü`, `kur güncelleme`) analistin verdiği **örnektir**, evrensel bir küme
değil. Başka bir alanda o kategoriler anlamsızdır.

Bu ikinci koşum, birinci koşumun *"analizin başlıklarını kullan"* kuralının ezberlenmiş
bir kategori listesiyle karıştırılmadığını kanıtlar.

---

## Yan beklentiler (zincirin çalıştığının kanıtı)

Vakanın konusu değil ama gelmezse eleme sınanacak bir şey bulamaz:

1. **R-06 ihlali (P1-P2)** — `KartDetay.tsx` içinde `setTutar('')`. Analiz "korunacaktır"
   diyor. Köprü senaryosu bundan doğar.
2. **R-08 ihlali** — `KartListesi.tsx` `catch` bloğu `setKartlar([])` yapıyor; analiz
   "boş liste gösterilmeyecektir" diyor. `hata` durumu hiç set edilmiyor.
3. **R-03 kısmi** — firma adı alanı müşteri tipine bakılmaksızın render ediliyor.
   Bireysel müşteride "hiç görünmeyecek" karşılanmıyor. RTM'de `⚠️`.
4. **R-09 eksik** — limit sorgusu hatası için kodda hiçbir karşılık yok. RTM'de `❌`,
   dolayısıyla o gereksinim için **senaryo yazılmaz** ve kapsam beyanında listelenir.

4. madde ayrıca eleme ile karışmamalı: `❌` yüzünden yazılmayan senaryo **birleştirilmiş
sayılmaz.** `BIRLESTIRILEN` sayacına girmez, kapsam beyanının "kapsanmayan" satırına girer.
