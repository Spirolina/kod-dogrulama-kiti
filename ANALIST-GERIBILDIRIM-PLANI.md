# Analist Geri Bildirim Planı — test paketi biçimi

Girdi: analistlerden gelen 6 madde (2026-08-24). Hepsi `ANALISTE-GIDECEK.md`'nin
biçimine dair. İkisi zinciri yukarıya kadar açıyor.

Bu plan `OTOMASYON-PLANI.md`'nin devamı değil, kardeşi: o **otomasyonu** kurdu,
bu **analistin gördüğü paketi** düzeltiyor. Kesiştikleri tek yer F6b (kanıt).

---

## 1. Gelen geri bildirim

| # | Analist ne dedi | Ne demek |
|---|---|---|
| F1 | Normal / tüzel / Kıbrıs müşterisi akışları varsa testler bunlara göre gruplansın; hesap ayarlandıktan sonra devam edilebilsin | **Koşum sırası** derdi. Pahalı olan adım hesabı ayarlamak |
| F2 | Gereksinim tablosu olsun, sadece kod var ne olduğu anlaşılmıyor. `(*)` da tam anlaşılmıyor | Paket kendi kendine yetmiyor |
| F3 | Bazı senaryolar birbirinin aynısı | Tekrar var, kimse elemiyor |
| F4 | Senaryonun sağlaması gereken koşullar yanında belirtilsin; ona göre test hesabının müşteri numarası ayarlanır | Hesap koşulu ayrı bir alan olmalı |
| F5 | Tablo fonksiyonel kısımlara ayrılabilir: hata durumları, kart görünümü, fiyat/kur güncelleme (örnek) | **Okuma ve kapsam** derdi |
| F6 | Beklenen sonuç çok yüzeysel. Ayrıca otomasyon koştuğunda başarılı/başarısız durumda kanıt ekran görüntüsü konabilmeli | İki ayrı iş: (a) senaryo metni, (b) koşum kanıtı |

---

## 2. A1 — Zincirdeki asıl hata: `MT-xx` bağlantı anahtarı sahte

Bu, geri bildirimin ortaya çıkardığı **var olan** hata. Önce bu düzelmezse
diğer beş madde durumu kötüleştirir.

Bugünkü sıra:

```
KAPI 5.5  KOPRU    -> ic/analist-girdisi.md sonuna K-xx ekler
KAPI 5.6  OTOMAT   -> ic/otomasyon-yargisi.md   | MT-01 | EVET | ... |
KAPI 5.7  ANALIST  -> ANALISTE-GIDECEK.md       MT numaralarını BURADA atar
                                                 ^^^^^^^^^^^^^^^^^^^^^^^
```

`GOREV: OTOMAT` henüz yazılmamış senaryolara numara veriyor. Girdisi
`ic/analist-girdisi.md`; orada `MT-xx` yok — gereksinim durumları, sınırlar,
reddetme kuralları ve `K-xx` var. Yani senaryo kümesini **ikinci kez, ayrı bir
agent'ta** türetip numarayı tahmin ediyor.

Kanıt kitin kendi içinde — `testler/altin-vakalar/AV-12-otomasyon-yargisi/beklenen.md`:

> "Senaryo numaraları koşuma göre değişir; bağlı gereksinim üzerinden eşleştir."

Altın vaka zaten numaraya güvenmiyor. Bu bir kaçamak, çözüm değil.

Bugün tolere edilebilir çünkü iki türetme aynı kurallardan aynı sırayla çıkıyor.
F1 ve F3 bunu bitiriyor:

- F3 tekrarları eler → senaryo sayısı düşer → numaralar kayar
- F1 akış varyantı ekler → sayı artar → numaralar bir daha kayar
- `/dv-otomat` faz B'de `MT-03.spec.js` yazar; analistteki `MT-03` başka bir testtir

Sessiz bozulma: test yeşil yanar, yanlış senaryoyu doğrular, RTM'de doğru
gereksinime bağlı görünür.

### Düzeltme — kapıları takas et

```
KAPI 5.5  KOPRU     -> ic/analist-girdisi.md sonuna K-xx
KAPI 5.6  ANALIST   -> ANALISTE-GIDECEK.md      MT-xx burada doğar
KAPI 5.7  OTOMAT    -> ic/otomasyon-yargisi.md  gerçek MT-xx'i yargılar
```

`GOREV: OTOMAT` girdisine `ANALISTE-GIDECEK.md` eklenir. Tek türetme, gerçek anahtar.

**İzolasyon bozulmuyor.** Yasak tek yönlü: analist agent'ı kodu görmeyecek.
`dv-iz-denetci` zaten kodu okuyor; analist paketini de okuması yeni bir sızıntı
kanalı açmıyor — ters yönde akıyor.

**Yan kazanç:** `dv-analist-paketi`'nin `ic/otomasyon-yargisi.md` okuma yasağı
ilk koşumda **yapısal** hale gelir; dosya henüz yoktur. Kitin dördüncü kez
uyguladığı desen: düz yazı yasağı yetenek kısıtına çevir.

Yasak satırı yine de kalır — ikinci koşumda önceki turun dosyası diskte durur.

**Maliyet:** kapı numaraları değişiyor. `KURULUM*.md`, `README.md`,
`NASIL-KULLANILIR.md`, `AV-6`, `AV-12` güncellenecek. Hedef ortamdaki kurulum tazelenmeli.

---

## 3. A2 — `ic/analist-girdisi.md` tek kanal

`dv-analist-paketi`'nin `tools` satırında `Grep`/`Glob` yok. Analiz dokümanı ve
`ic/analist-girdisi.md` dışında bilgiye erişemez. Altı maddenin dördü o dosyadan
geçmezse pakete giremez.

```
analiz.md
   |
   +-- dv-iz-denetci  GOREV: RTM
   |      ic/gereksinimler.md      R-xx + birebir metin   <- F2 verisi ZATEN VAR
   |      ic/rtm.md
   |      ic/analist-girdisi.md    <=== TEK KANAL
   |         - gereksinim durumları        (var)
   |         - sayısal sınırlar            (var)
   |         - reddetme kuralları          (var)
   |         - cihaz/ortam koşulu          (var)
   |         - müşteri akışı varyantları   (F1 - YENİ)
   |         - fonksiyonel alanlar         (F5 - YENİ)
   |
   +-- GOREV: KOPRU   K-xx senaryoları -> aynı dosyanın sonuna
   |
   +-- dv-analist-paketi (Read, Write)
   |      ANALISTE-GIDECEK.md   <- MT-xx burada doğar, hesap koşulu burada yazılır
   |
   +-- GOREV: OTOMAT
          ic/otomasyon-yargisi.md   hesap koşulu -> hesap-anahtari
```

**F2 bedava:** `ic/analist-girdisi.md` "Gereksinim durumları" tablosunda
`Gereksinim (analizden birebir)` kolonu zaten var. Paket onu basmıyor. Saf şablon işi.

**F4 tek zincir:** hesap koşulu senaryoyla birlikte doğar, aşağı akar.

```
hesap koşulu (iş dili)      ->  hesap-anahtari       ->  $ENV kimlik
ANALISTE-GIDECEK.md             ic/otomasyon-yargisi     .env.local
"Bireysel, günlük limiti          limit-50k-             TEST_USER_1
 50.000, o gün 45.000 TL          kullanilan-45k
 göndermiş"
```

Tek türetme. İkinci bir hesap sözlüğü kurulmuyor — `GOREV: OTOMAT` zaten bu
anahtarı üretiyordu, artık kaynağı tahmin değil yazılı kolon.

---

## 4. A3 — Müşteri numarası kişisel veridir. Kit asla yazmaz

Müşteri no kolonu pakete **boş** gider. Analist Confluence'ta doldurur.

Kit bir müşteri no değeri üretirse gerçek müşteri numarası wiki sayfasına girer ve
oradan geri alınamaz. `GOREV: OTOMAT` zaten "hesap numarası, müşteri adı, gerçek
veri yazma" diyor; aynı kural analist paketine de yazılıyor.

Aynı sebep F6b'de tekrar çıkıyor: ekran görüntüleri bakiye, isim, müşteri no içerir.
`test-results/` ve `playwright-report/` gitignore'a girer, kanıt dosyaları
kimlik bilgisi kadar hassas sayılır.

### Terminoloji — kurum içi terimler repoda geçmez

Analistlerin kullandığı iç terim (müşteri numarasının kurum içindeki adı) bu
repoda **geçmiyor.** Şablonlarda nötr karşılığı yazılıyor: `Müşteri no`.

Sebep: repo herkese açık. Sektör adı ile kuruma özgü jargon bir araya geldiğinde
kaynağı daraltır — jenerik kelimeden daha çok ele verir. İşlevsel kayıp yok:
analist `Müşteri no` başlığını okur ve ne yazacağını bilir.

Kurulum tarafında tek kelimelik yeniden adlandırma serbest; karar senin.

**Ayrıca:** `TODOS.md` ve `OTOMASYON-PLANI.md` içinde sektörü söyleyen kelime
**zaten var ve zaten public** (7 satır). HEAD'i temizlemek kolay, git geçmişi
öyle değil. Ayrı bir karar — §13'te kapsam dışı.

---

## 5. D1 kararı — tablo iki eksene birden bölünemez

**Seçilen: A — okuma yapısı fonksiyonel, koşum yapısı hesaba göre, ayrı.**

F1'in derdi koşum sırası, F5'in derdi okuma ve kapsam. Tek tabloyu ikisine birden
zorlamak yerine ayır — kitin her yerindeki desen.

F1'in asıl birimi müşteri tipi değil **hesap koşulu.** "Tüzel + limiti dolu" ile
"tüzel + limiti boş" iki ayrı test hesabı. Müşteri tipi, hesap koşulunun yalnız bir bileşeni.

Reddedilenler:
- **Bölüm = hesap koşulu, tek tablo.** Koşum için en iyisi ama fonksiyonel kapsam
  kolonda kalır; "kur güncellemeyi kaç senaryo kapsıyor" tabloyu tarayarak cevaplanır.
- **İki seviyeli başlık (akış -> fonksiyonel).** Confluence'ta her bölüm ayrı tablo:
  3 akış x 5 alan = 15 küçük tablo, çoğu 1-2 satır. Ayrıca müşteri tipi hesap
  koşulunun sadece bir parçası olduğu için F1'i çözdü sanılır, çözmez.

---

## 6. Yeni `ANALISTE-GIDECEK.md` biçimi

```
h2. Test Paketi — <konu>

İlgili analiz: [<analiz sayfası>]
Hazırlayan: <ad> · Tarih: <YYYY-AA-GG>

Bu paket analiz dokümanındaki <n> gereksinimin <n>'sini kapsıyor.
Kapsanmayan: R-?? — <özet>. <neden>, <nerede kontrol edildi>.
Toplam <n> senaryo · <n> negatif · <n> sınır değeri · <n> tanesi (*) işaretli.
Birleştirilen tekrar senaryo: <n>.

h3. Gereksinimler

||ID||Gereksinim||
|R-01|"<analiz dokümanından birebir>"|
|R-02|"<...>"|

h3. Koşum planı — hesaba göre

Bir müşteri no ayarlayın, o satırdaki tüm testleri arka arkaya koşun.
Müşteri no kolonunu siz doldurun.

||Hesap||Sağlaması gereken koşullar||Müşteri no||Testler||
|bireysel-limit-dolu|Bireysel müşteri. Günlük limiti 50.000 TL. O gün 45.000 TL göndermiş| |MT-01, MT-04, MT-09|
|tuzel-vadesi-gecmis|Tüzel müşteri. En az bir vadesi geçmiş faturası olan| |MT-05, MT-06|
|kibris-doviz|Kıbrıs müşterisi. Döviz hesabı olan| |MT-11|

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

h3. <Fonksiyonel alan — analiz dokümanının kendi başlığı>

||Test||Gereksinim||Hesap||Ön koşul||Adımlar||Beklenen sonuç||Odak||Sonuç||Kanıt||Not||
|MT-01|R-01|bireysel-limit-dolu|—|<numaralı adımlar>|<üç parçalı>| | | | |
|MT-04|R-01, R-05|bireysel-limit-dolu|MT-01'in devamı|<...>|<...>|(*)| | | |

h3. <Bir sonraki fonksiyonel alan>
...

Sonuç kolonuna GEÇTİ / KALDI / KOŞULMADI yazınız.
KALDI ise Not kolonuna ne gördüğünüzü kısaca yazınız.
```

10 kolon. Confluence'ta geniş ama yatay kaydırılıyor. Daraltma seçeneği
(Odak'ı `MT-04 (*)` biçiminde Test kolonuna katmak) §14'te riskle birlikte duruyor.

### Fonksiyonel alan başlıkları nereden gelir

Sabit liste **yok.** "Hata durumları / kart görünümü / kur güncelleme" analistin
verdiği örnek, evrensel bir kategori seti değil.

Kural sırası:
1. Analiz dokümanının kendi başlıkları kullanılır. Uydurma yok, izlenebilirlik bedava.
2. Analizde başlık yoksa gereksinimler davranış türüne göre kümelenir, başlık iş
   dilinde yazılır.
3. Teknik başlık (ör. "Servis katmanı") §1b dil dönüşüm tablosuna göre çevrilir.
4. Boş bölüm yazılmaz. Bir test tek bölüme girer; birden fazlasına uyuyorsa dar olan.

---

## 7. F1 — müşteri akışı: varyant çoğaltma değil, varyant *farkı*

`ic/analist-girdisi.md` yeni bölüm alır:

```markdown
## Müşteri akışı varyantları
| Varyant | Hangi gereksinim farklı davranıyor | Kaynak |
|---|---|---|
| bireysel | — (temel akış) | analiz §1 |
| tüzel | R-03 farklı limit uygulanıyor | analiz §2.1 |
| kibris | R-05 kur bilgisi de gösteriliyor | analiz §4 |
```

**Yalnız analizin ayırdığı varyantlar yazılır.** Analiz tüzel müşteriden hiç
bahsetmiyorsa varyant yoktur; uydurulmaz. Varyant yoksa bölüm "tek akış" yazar.

Analist paketi kuralı: bir senaryo **yalnız analiz o varyantta farklı davranış
tarif ediyorsa** çoğaltılır. Aksi halde tek senaryo.

Bu, F3'ün yarısını kaynağında öldürüyor: naif akış çoğaltması tekrarın ta kendisi.

---

## 8. F3 — tekrar eleme kuralı

Tanımsız "aynısı" tehlikeli: agent sınır senaryosunu ayıklar ve paket tertemiz görünür.

```
İki senaryo AYNIDIR ancak ve ancak üçü birden eşleşiyorsa:
    hesap koşulu  VE  adımlar  VE  beklenen sonuç

Biri farklıysa AYNI DEĞİLDİR:
    beklenen sonuç farklı  -> ayrı senaryo (pozitif/negatif çifti)
    hesap koşulu farklı    -> ayrı senaryo (sınır değeri, akış varyantı)
    adım sayısı farklı     -> ayrı senaryo
```

Birleştirme kuralları:

1. **`(*)` hayatta kalır.** Biri işaretliyse birleşik satır işaretlidir.
2. **Gereksinim kolonu ikisini de taşır:** `R-02, R-05`. RTM zinciri kopmaz.
3. Daha somut test verisi olan metin kazanır.
4. Silinen `MT` numarası yeniden kullanılmaz; kapsam beyanına `Birleştirilen: <n>` yazılır.

2. maddenin gerekçesi ince ve kritik: `K-xx` köprü senaryoları çoğu zaman mevcut
bir `MT`'nin aynısıdır. Birleşmede `(*)` düşerse o test KALDI olduğunda **yakalanan
defect kaçan sayılır** — kitin tek metriği sessizce bozulur.

Sağlık işareti: `BIRLESTIRILEN: <n>`.

---

## 9. F6a — beklenen sonuç üç parçalı

"Daha ayrıntılı" ile "tek beklenen sonuç" çarpışıyor. Ayrıntı ikinci assert
demek değil; **kesinlik** demek.

```
Beklenen sonuç =
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

Üçüncü parça analistlerin atladığı yer ve otomasyonda en değerli assert:
regresyonların çoğu "olması gereken oldu ama başka bir şey bozuldu" biçiminde.

Uydurma yasak: değişmemesi gereken somut bir şey yoksa `—` yazılır.

Bu, altı maddenin **otomasyona en çok dokunanı**. Muğlak beklenen sonuç ->
muğlak assert -> işe yaramaz test.

---

## 10. F6b — koşum kanıtı (ekran görüntüsü)

Faz B işi. `otomasyon-sozlesmesi.md`'ye yeni bölüm.

```javascript
// testler/yardimcilar/kanit.js — /dv-otomat üretir
import { test as base } from '@playwright/test';

export const test = base;
export { expect } from '@playwright/test';

base.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') return;   // KALDI ise Playwright kendi
                                              // görüntüsünü tam kırılma anında aldı
  const mt = testInfo.title.split(' ')[0];    // "MT-03"
  try {
    await testInfo.attach(`${mt}__gecti.png`, {
      body: await page.screenshot(),          // viewport — fullPage değil
      contentType: 'image/png',
    });
  } catch {
    // kanıt alınamadı; testi düşürme
  }
});
```

```javascript
// playwright.config
use: {
  screenshot: 'only-on-failure',   // kırılma anında, en iyi kanıt
  trace:      'retain-on-failure',
  video:      'off',
},
reporter: [['html', { open: 'never' }]],
```

Tasarım kararları:

| Karar | Neden |
|---|---|
| GEÇTİ afterEach'te, KALDI Playwright'ın kendisinde | Kırılma anındaki görüntü teardown sonrasından iyidir. Çift görüntü de olmaz |
| `status !== 'passed'` erken çıkış — **skipped dahil** | Hesabı olmayan test atlanır; login ekranının görüntüsü kanıt sanılır |
| try/catch | Kırık sayfada `page.screenshot()` atabilir. Kanıt alınamaması testi düşürmemeli |
| `testInfo.attach`, dosyaya elle yazma değil | HTML raporda teste ilişik gelir, adı `MT-xx` ile eşleşir |
| viewport, `fullPage: false` | 15 test x tam sayfa hesap ekranı = onlarca MB |
| Confluence'a **otomatik gitmez** | Görüntüde bakiye, isim, müşteri no var. Hangi görüntünün paylaşılacağı developer'ın kararı |

`dv-otomat-yazar` test gövdesine ekran görüntüsü kodu **yazmaz** — fixture global.
Tek değişiklik: `import { test, expect } from './yardimcilar/kanit'`.

`OTOMASYON.md` raporu yeni tablo alır: `MT-xx | GEÇTİ/KALDI | kanıt dosyası`.
Developer ilgili görüntüyü Confluence'taki `Kanıt` kolonuna elle koyar.

`sablonlar/gitignore-eki`: `test-results/`, `playwright-report/`.

---

## 11. Altın vakalar

**AV-13 — tekrar ve gruplama (yeni).** Diğer vakalar *bulmayı* ve *karar vermeyi*
test ediyor; bu **elemeyi** test ediyor. Başarısızlık biçimi *sessiz senaryo kaybı*
ve paket tertemiz görünür — en tehlikeli tür.

`analiz.md` şunları içerir:
- Üç açık başlık (fonksiyonel alan kaynağı): fatura listesi görünümü, ödeme akışı, hata durumları
- Tüzel müşteri varyantı, tek bir gereksinimde farklı davranış
- Gerçek tekrar: iki gereksinimden çıkan senaryolar birebir aynı
- Sahte tekrar 1: yalnız beklenen sonuç farklı
- Sahte tekrar 2: yalnız hesap koşulu farklı (sınır değeri)
- `K-xx` köprü senaryosu mevcut bir `MT`'nin aynısı -> birleşmeli, `(*)` yaşamalı

`beklenen.md` doğrular: `BIRLESTIRILEN` sayısı · `(*)` hayatta kalması · gereksinim
tablosu · koşum planı ve **boş** Müşteri no kolonu · bölüm başlıklarının analizle eşleşmesi ·
beklenen sonuçların üç parçalı olması · sahte tekrarların birleşmemesi.

**AV-6 (temiz koşum)** — gereksinim tablosu ve koşum planının temiz koşumda da
üretildiğini doğrular. Sessiz atlama en çok burada olur.

**AV-12** — kapı takasından sonra `MT-xx` eşleşmesi artık gerçek. `beklenen.md`'deki
"numaralar koşuma göre değişir, gereksinim üzerinden eşleştir" kaçamağı kalkar,
yerine birebir `MT` eşleşmesi gelir.

---

## 12. Ölçüm

`ic/analist-sonuclari.md` ve `SONUC.md` §4 zaten `Koşan` kolonunu aldı (v0.9.0).
Bu planla eklenen: `Kanıt` kolonu ve kapsam beyanındaki `Birleştirilen` sayacı.

Yeni sağlık işaretleri:

```
dv-analist-paketi:
  BIRLESTIRILEN: <n>
  FONKSIYONEL_BOLUM: <n>
  AKIS_VARYANTI: <n>
  HESAP_KOSULU: <n>          # koşum planındaki satır sayısı
  MUSTERI_NO_YAZILDI: 0            # 0 DEĞİLSE görev geçersiz

dv-iz-denetci GOREV: OTOMAT:
  ESLESMEYEN_MT: 0           # ANALISTE-GIDECEK.md'de olup yargılanmayan
```

`ESLESMEYEN_MT` A1'in nöbetçisi: takas doğru yapıldıysa her `MT` yargılanır.

---

## 13. NOT in scope

| Ne | Neden dışarıda |
|---|---|
| Confluence'a otomatik ekran görüntüsü yükleme | Görüntüde müşteri verisi var. Hangi kanıtın paylaşılacağı insan kararı |
| Test hesabı havuzu yönetimi | Kurum tarafında yaşayan bir süreç, kitin işi değil |
| Analiz dokümanının biçimini değiştirmek | Başkasının alanı. `TODOS.md` #2 zaten bunu bekletiyor |
| Sabit fonksiyonel kategori listesi | Alan bağımlı. Analizin kendi başlıkları daha doğru ve izlenebilir |
| Kolon sayısını 10'un altına indirmek | Denendi (§14). Odak'ı Test'e katmak mümkün ama geri dönüş eşlemesini elle yapar |
| Ekran görüntüsü karşılaştırması (visual regression) | Ayrı bir disiplin. Hesap ekranında veri her koşumda değişir, sürekli kırmızı yanar |
| Kodlama akışı | Dokunulmuyor. Değişmedi |

## 14. Zaten var olan

| İhtiyaç | Nerede | Yeniden kuruluyor mu |
|---|---|---|
| Gereksinim birebir metni | `ic/analist-girdisi.md` gereksinim tablosu | Hayır — sadece basılıyor |
| Hesap anahtarı | `GOREV: OTOMAT` | Hayır — kaynağı tahminden yazılı kolona taşınıyor |
| `(*)` yakalanan/kaçan muhasebesi | `analist-test-paketi.md` §7 | Hayır — birleştirmede korunuyor |
| Kırmızı triyajı | `otomasyon-sozlesmesi.md` §4 | Hayır — kanıt buna bağlanıyor |
| `SKIP != FAIL` | `dv-otomat-yazar` Kural 4 | Hayır — kanıt fixture'ı skipped'ı atlıyor |
| Teknik sızıntı grep'i | `analist-test-paketi.md` §3b | Genişliyor: yeni kolonlar da taranıyor |
| `Koşan` kolonu | v0.9.0 | Hayır — yanına `Kanıt` geliyor |

## 15. Başarısızlık biçimleri

| Biçim | Belirti | Karşı önlem |
|---|---|---|
| Tekrar eleme sınır senaryosunu yutar | Paket kısalır, kimse fark etmez | Üçlü eşleşme kuralı + `BIRLESTIRILEN` sayacı + AV-13 sahte tekrarları |
| Birleşmede `(*)` düşer | Yakalanan defect kaçan sayılır, metrik bozulur | Açık kural + AV-13 köprü senaryosu |
| Akış varyantı uydurulur | 3 kat senaryo, hiçbiri gerçek bir farkı test etmiyor | "Yalnız analizin ayırdığı varyant" + `AKIS_VARYANTI` sayacı |
| Agent müşteri no uydurur | Gerçek müşteri numarası Confluence'a girer | `MUSTERI_NO_YAZILDI: 0` kapısı + açık yasak |
| Kanıt görüntüsü atlanan testten alınır | Login ekranı kanıt sanılır | `status !== 'passed'` erken çıkış |
| Beklenen sonuç "ayrıntılı" diye ikinci assert kazanır | Senaryo geçtiği halde test kırmızı | Üç parça **tek** sonuçtur; §9 örneği |
| Fonksiyonel başlık teknik dil taşır | Confluence'a sızıntı | §3b grep'i bölüm başlıklarını da tarar |
| Kapı takası yarım kalır | OTOMAT eski girdiyle koşar, `MT` yine sahte | `ESLESMEYEN_MT: 0` kapısı |
| 10 kolon dar ekranda okunmaz | Analist tabloyu terk eder | Pilotta ölç; gerekirse Odak'ı Test'e kat |

## 16. Duvar saati

`GOREV: OTOMAT` **ucuzluyor** — kapsamı yeniden türetmek yerine yazılmış paketi
okuyor. Yeni maliyet: tekrar eleme geçişi ve RTM'de varyant/alan çıkarımı.

Net: T1 18 -> 20, T2 6 -> 7.

---

## Implementation Tasks

| # | Ne | Dosya | Bağımlı |
|---|---|---|---|
| T1 | Kapı takası: 5.6 = Analist, 5.7 = Otomasyon. `ESLESMEYEN_MT` kapısı | `.claude/skills/dv-dogrula/SKILL.md` | — |
| T2 | `GOREV: OTOMAT` girdisine `ANALISTE-GIDECEK.md`; yargı tablosu gerçek `MT`'ye bağlanır | `.claude/agents/dv-iz-denetci.md` | T1 |
| T3 | Aşama 4'e "Müşteri akışı varyantları" ve "Fonksiyonel alanlar" bölümleri | `.claude/agents/dv-iz-denetci.md` | — |
| T4 | Hesap anahtarı kaynağı: "Ön koşul/veri" -> `ANALISTE-GIDECEK.md` `Hesap` kolonu | `.claude/agents/dv-iz-denetci.md` | T2 |
| T5 | Şablon: gereksinim tablosu, koşum planı + boş müşteri no, yeni 10 kolon, fonksiyonel bölümler | `sablonlar/analist-test-paketi.md` | — |
| T6 | Şablon §3: `(*)` açıklaması yeniden yazılır (ne yapılacağı, sebebi değil) | `sablonlar/analist-test-paketi.md` | — |
| T7 | Şablon §2: beklenen sonuç üç parçalı kural + örnek | `sablonlar/analist-test-paketi.md` | — |
| T8 | Şablon: tekrar eleme kuralı (üçlü eşleşme, `(*)` korunur, çift `R`) yeni bölüm | `sablonlar/analist-test-paketi.md` | — |
| T9 | Şablon §3b: grep bölüm başlıklarını ve yeni kolonları da tarar | `sablonlar/analist-test-paketi.md` | T5 |
| T10 | Agent: türetme kuralları, varyant kuralı, eleme kapısı, müşteri no yasağı, yeni sağlık işaretleri | `.claude/agents/dv-analist-paketi.md` | T5–T9 |
| T11 | Sözleşmeye §9 Koşum kanıtı; profile bir şey eklenmiyor | `sablonlar/otomasyon-sozlesmesi.md` | — |
| T12 | `kanit.js` fixture üretimi + `playwright.config` kanıt ayarları + `OTOMASYON.md` kanıt tablosu | `.claude/skills/dv-otomat/SKILL.md` | T11 |
| T13 | `import` yolu fixture'a döner; ekran görüntüsü kodu yazma yasağı | `.claude/agents/dv-otomat-yazar.md` | T12 |
| T14 | `test-results/`, `playwright-report/` + hassasiyet notu | `sablonlar/gitignore-eki` | T11 |
| T15 | `Kanıt` kolonu; §4'e `Birleştirilen` sayacı | `sablonlar/sonuc-sablonu.md`, `sablonlar/analist-test-paketi.md` §7 | T5 |
| T16 | AV-13 yeni altın vaka (`analiz.md`, `kod/`, `beklenen.md`) | `testler/altin-vakalar/AV-13-tekrar-ve-gruplama/` | T5–T10 |
| T17 | AV-6 gereksinim tablosu + koşum planı beklentisi; AV-12 `MT` kaçamağı kalkar | `testler/altin-vakalar/` | T1, T16 |
| T18 | Kapı numaraları, dosya haritası, sürüm | `README.md`, `KURULUM.md`, `KURULUM-TASK-MODU.md`, `NASIL-KULLANILIR.md`, `VERSION` | T1–T17 |

18 görev, ~14 dosya. **0 yeni agent, 0 yeni skill.** Genişlik var, derinlik yok:
bir kapı sırası değişiyor, gerisi şablon ve kural metni.

---

## Uygulama durumu — v1.0.0 (2026-08-24)

18 görevin tamamı uygulandı.

| # | Ne | Nerede |
|---|---|---|
| T1 | Kapı takası 5.6 ANALIST / 5.7 OTOMAT + `ESLESMEYEN_MT` + SIRALI MOD 5-6 yeniden | `dv-dogrula/SKILL.md` |
| T2 | `GOREV: OTOMAT` girdisine `PAKET`; "senaryolar nereden gelir" bölümü | `dv-iz-denetci.md` |
| T3 | Aşama 4'e "Fonksiyonel alanlar" + "Müşteri akışı varyantları" ve türetme kuralları | `dv-iz-denetci.md` |
| T4 | Hesap anahtarı paketin koşum planından okunur, yeniden üretilmez | `dv-iz-denetci.md` |
| T5 | Sayfa iskeleti, gereksinim tablosu, koşum planı, 10 kolon, fonksiyonel bölümler | `analist-test-paketi.md` §5 |
| T6 | `(*)` açıklaması yeniden yazıldı — ne yapılacağı, sebebi değil | `analist-test-paketi.md` §3 |
| T7 | Beklenen sonuç üç parçalı | `analist-test-paketi.md` §2b |
| T8 | Tekrar eleme kuralı + `(*)` korunması | `analist-test-paketi.md` §2e |
| T9 | İki mekanik kontrol: teknik sızıntı + müşteri numarası | `analist-test-paketi.md` §3b |
| T10 | Türetme, bölümleme, varyant, eleme kapısı, 8 yasak, 12 sağlık işareti | `dv-analist-paketi.md` |
| T11 | §9 Koşum kanıtı: fixture, config, dört kural, rapor bağı | `otomasyon-sozlesmesi.md` |
| T12 | Fixture üretimi, senaryo kaynağı `ANALISTE-GIDECEK.md`, KAPI 5 altıncı kontrol, rapor §5 | `dv-otomat/SKILL.md` |
| T13 | Fixture'dan `import`, üç parçalı beklenen, iki yeni yasak | `dv-otomat-yazar.md` |
| T14 | `test-results/`, `playwright-report/` | `gitignore-eki` |
| T15 | `Kanıt` kolonu, `Birleştirilen` sayacı, koşum kanıtı bloğu | `sonuc-sablonu.md`, `analist-test-paketi.md` §7 |
| T16 | AV-13 — `analiz.md`, iki kod dosyası, `beklenen.md` (228 satır) | `testler/altin-vakalar/AV-13-tekrar-ve-gruplama/` |
| T17 | AV-6 paket biçimi kontrolü; AV-12 `MT` kaçamağı kalktı; AV-4/5/11 kapı numaraları; README | `testler/altin-vakalar/` |
| T18 | Kapı numaraları, dosya sayıları, kurulum, D18 karar satırı, sürüm | `README`, `KURULUM*`, `NASIL-KULLANILIR`, `DOGRULAMA-WORKFLOW-PLAN`, `TODOS`, `VERSION` |

### Uygularken çıkan iki ek bulgu

**KURULUM.md `dv-otomat`'ı kopyalamıyordu.** Doğrulama adımı "3 klasör" bekliyor ama
`cp` satırları yalnız `dv-dogrula` ve `dv-kavra`'yı kopyalıyordu. v0.9.0'da skill eklendi,
kurulum satırı unutuldu. Kaldırma komutunda da eksikti. Düzeltildi.

**`OTOMASYON-PLANI.md` tarihsel kaydı korundu.** Kapı sırası diyagramının üstüne
"ÜSTÜ ÇİZİLDİ" notu kondu, gerisi olduğu gibi bırakıldı. Geçmiş bir turun kaydını
sonradan düzeltmek onu sahteleştirir; hangi kararın ne zaman ve neden değiştiği
kaybolur.

### Uygulanmayan tek kalem

**Repo geçmişindeki sektör kelimesi** (§4 terminoloji notu). `TODOS.md` #7 olarak
açıldı. Yeni dosyalarda kelime geçmiyor; kalan iş yalnız geçmiş ve o senin kararın.

---

## GSTACK REVIEW REPORT

| Runs | Status | Findings |
|---|---|---|
| Step 0 kapsam | tamam | 7 kalem zaten var, yeniden kurulmuyor. Karmaşıklık kapısı tetiklendi (14 dosya) — genişlik, derinlik değil: 0 yeni agent/skill |
| 1. Mimari | 3 bulgu | A1 `MT-xx` bağlantı anahtarı sahte (P1, var olan hata) · A2 tek kanal genişlemeli (P1) · A3 müşteri no = kişisel veri (P2) |
| 2. Kural kalitesi | 4 bulgu | Q1 "aynısı" tanımsız (P1) · Q2 birleşme `(*)` öldürüyor (P2) · Q3 ayrıntı vs tek sonuç (P2) · Q4 15 tavanı varyantla şişiyor (P3) |
| 3. Altın vakalar | 3 bulgu | T1 eleme için vaka yok (P1) · T2 AV-6 genişlemeli (P2) · T3 kanıt koşum zamanı, vakayla sınanamaz — hedef ortamdaki ilk koşum doğrular |
| 4. Performans | 2 bulgu | Takas OTOMAT'ı ucuzlatıyor; net T1 18->20 · Kanıt maliyeti viewport + attach ile sınırlandı |
| Kararlar | 1 soruldu | D1 tablo ekseni -> A (fonksiyonel bölüm + ayrı koşum planı) |

VERDICT: PLAN HAZIR — 18 görev, ~14 dosya, 0 yeni agent/skill. A1 en kritik kalem:
geri bildirimden bağımsız olarak var olan bir hata ve F1/F3 onu patlatıyor.

CODEX: koşulmadı — hedef ortam kısıtı, dış araç yok.
CROSS-MODEL: koşulmadı — aynı sebep.

NO UNRESOLVED DECISIONS
