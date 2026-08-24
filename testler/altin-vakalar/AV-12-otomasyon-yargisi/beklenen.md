# Beklenen — AV-12

Test ettiği: **`GOREV: OTOMAT`** (KAPI 5.6). Otomasyon yargısının karar dallarını sınar.

Bu vakanın asıl konusu bulgular değil, **yargı.** Bulgular sadece zinciri çalıştırmak ve
`(*)` üretmek için var. Yargı yanlışsa vaka kalır, bulgular doğru olsa bile.

Koşum katmanı varsayımı: Playwright · gerçek ortam · veri mock'u yok · arıza enjeksiyonu
serbest (`OTOMASYON-PLANI.md` §4, §4d).

---

## Beklenen yargı tablosu

`ic/otomasyon-yargisi.md` şu dalların **hepsini** içermeli. Senaryo numaraları koşuma göre
değişir; bağlı gereksinim üzerinden eşleştir.

| Bağlı gereksinim | Beklenen `Otomat` | Neden |
|---|---|---|
| R-02 — tutar boş bırakılırsa uyarı | `EVET` | Adımların tamamı child app içinde, ön koşul basit |
| R-03 — servis yanıt vermezse | `EVET-ARIZA` | Hata yolu. `/api/odeme` isteği kesilerek üretilir |
| R-04 — vadesi geçmiş fatura kırmızı | `EVET` | Vadesi geçmiş faturası olan bir hesap gerekir |
| R-05 — ödenen fatura listeden kalkar | `EVET` | Durum değiştiriyor ama hesapla kurulabilir |
| R-06 — gece 00:00 sonrası "bugün son gün" | `HAYIR-VERI` | Ortam saatine bağlı; hiçbir hesapla kurulamaz |
| R-07 — toplam kuruş farkı oluşturmaz | `EVET` | `(*)` çıkacak **ama analiz değeri çiviliyor** |

Ayrıca **`BELİRSİZ`** en az bir kez çıkmalı — aşağıya bak.

---

## Sınanan dallar

### 1. `EVET-ARIZA` — hata yolu otomatikleşir

R-03 bir hata yolu. Eski rubrikte bu `HAYIR-HATA` idi; artık arıza enjeksiyonuyla
otomatikleşiyor (§4d).

Gerekçe kolonunda **hangi isteğin bozulacağı** yazmalı — "servis hatası" yetmez,
`/api/odeme` kesilecek gibi somut olmalı.

**Kalır:** `HAYIR-HATA` ya da `HAYIR` çıkarsa. Rubrik güncellenmemiş demektir.

### 2. `EVET` — çivili `(*)`

R-07'de kod float topluyor (`reduce` + `toFixed`). Bulgu çıkacak; güven < 7 kalırsa
köprüden `(*)` senaryosu doğacak.

Analiz **"kuruş farkı oluşturmadan"** diyor — beklenen değer çivili. Dolayısıyla `(*)`
olması otomatikleşmeye engel değil.

**Kalır:** `TUR-2` çıkarsa. `TUR-2` yalnız analiz sessiz kaldığında doğrudur; burada
analiz konuşuyor.

### 3. `HAYIR-VERI` — zamana bağlı

R-06 gece yarısını gerektiriyor. Test hesabı bunu çözmez; ortam saatini oynatmak veri
mock'una en yakın şey ve yapılmıyor.

**Kalır:** `EVET` çıkarsa. Yargı fazla iyimser, koşmayacak bir test listeye girer.

### 4. `BELİRSİZ` — karar verilemedi

Kapsamda `FaturaListesi.tsx` ve `OdemeEkrani.tsx` var, ama **listeden ödeme ekranına
nasıl geçildiği yok.** Rota mı, container app navigasyonu mu, köprü çağrısı mı —
kodda karşılığı bulunmuyor.

*"Fatura listesinden bir faturaya dokunun, ödeme ekranı açılır"* tipi bir senaryo için
doğru cevap `BELİRSİZ` ve gerekçe **neyin bulunamadığını** söylemeli.

**Kalır:** bu senaryoya `EVET` denirse. Sessiz `EVET`, bu vakanın var olma sebebi —
faz B'de koşmayan ya da yanlış geçen test doğurur.

### 5. Gerekli hesap anahtarları

`EVET` ve `EVET-ARIZA` olan her satırın hesap anahtarı olmalı, ve dosyanın sonunda
toplu liste bulunmalı.

Anahtarlar iş dilinde, küçük harf-tire: `vadesi-gecmis-faturasi-olan`,
`odenmemis-birden-fazla-fatura`. Aynı durumu isteyen senaryolar **aynı anahtarı**
paylaşmalı.

**Kalır:** gerçek hesap numarası, müşteri adı ya da `hesap-1` gibi anlamsız anahtar
üretilirse.

---

## İkinci koşum — boş girdi

Aynı vakayı bir kez de `ic/analist-girdisi.md` boşken koş (senaryo tablosunu sil).

Beklenen: `GOREV: OTOMAT` boş bir tablo üretir ve sağlık işaretinde `YARGILANAN: 0` yazar.

**Kalır:** senaryo uydurursa, ya da sessizce hiçbir şey yazmazsa. `YARGILANAN: 0` bir
sonuç değil sinyaldir — üst akış bunu görüp durmalı.

---

## Yan beklentiler (zincirin çalıştığının kanıtı)

Bunlar vakanın konusu değil ama gelmezse yargı sınanacak bir şey bulamaz:

1. **R-03 ihlali (P1-P2)** — `OdemeEkrani.tsx` içinde `catch` bloğu `setTutar('')` yapıyor.
   Analiz *"tutar alanı korunacaktır"* diyor. Kod tam tersini yapıyor.
2. **R-01 ihlali** — kod filtreliyor (`filter`) ama **sıralamıyor**. "Ödenmemiş faturalar
   üstte" gereksinimi karşılanmıyor. RTM'de `⚠️` ya da `❌`.
3. **R-07 float** — `reduce((a,f) => a + f.tutar, 0)` + `toFixed(2)`. L2 lensi.

---

## Neden bu vaka

Diğer 11 vaka *bulmayı* test ediyor. Bu vaka **karar vermeyi** test ediyor.

`GOREV: OTOMAT`'ın en tehlikeli hatası yanlış `HAYIR` değil, **emin olmadığı yerde `EVET`
demesi.** Yanlış `HAYIR` bir senaryoyu elde bırakır — maliyeti manuel test. Sessiz `EVET`
ise faz B'de koşmayan bir test doğurur ve suite kırmızı yanar; kimse sebebini bilmez,
üçüncü gün kimse bakmaz.

`BELİRSİZ` dalı bu yüzden var ve bu yüzden test ediliyor.
