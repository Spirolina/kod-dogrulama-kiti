# Nasıl Kullanılır — günlük kullanım

Elinde analiz var, kod yazıldı. Bundan sonrası burada.

Kurulum tek seferlik ve ayrı: `KURULUM-TASK-MODU.md` (terminalsiz ortam) veya
`KURULUM.md` (terminal).

---

## Akışın tamamı

```
Kod yazıldı
    │
    ▼
[Doğrulama task'ı]  →  SONUC.md  +  ANALISTE-GIDECEK.md
    │
    ▼
SONUC.md — SADECE durum satırı + §8 sağlık işaretleri     1 dk
    │        (doğrulama gerçekten koştu mu?)
    │
    ├─── ANALISTE-GIDECEK.md → Confluence ────────┐       5 dk
    │       analistler beklemesin, sınavdan        │
    │       bağımsız, paralel yürür                │
    │                                              │
    ▼                                              │
►► KAVRAYIŞ SINAVI ◄◄                             │      15 dk
   (Copilot / Windsurf)                            │
   BULGULARI OKUMADAN ÖNCE                         │
    │                                              │
    ▼                                              │
SONUC.md'yi tam oku — §1 ❌/➕, §2 bulgular        │      10 dk
    │                                              │
    ▼                                              │
Düzelt                                             │
    │                                              │
    ┌──────────────────────────────────────────────┘
    ▼
Analist sonuçları gelir → SONUC.md §4
    │
    ▼
SONUC.md kapanır → imza → merge
```

## Sıra neden bu — sınav bulgulardan önce

Bulgular **kodun tam olarak kırılgan olduğu yerleri** gösteriyor. Sınav soruları da aynı
yerlere geliyor: sınır değeri, hata yolu, yarıçap. İkisi aynı noktaya bakıyor.

§2'de *"liste yeniden sıralandığında satırlar karışıyor"* yazısını okuduktan sonra sınavda
*"listeyi sıraladığında ne olur"* sorusuna cevap veriyorsan, ölçtüğün şey kodu anlaman
değil — **raporu hatırlaman**. Skor yüksek çıkar, hiçbir şey ifade etmez.

İki sebep daha:

- Sınav, kodun **savunulabilir olup olmadığını** söyler. Eşiğin altında kalırsan doğru
  hamle "bulguyu düzelt" değil, **kodu bölmek**. Bunu yamayı yazmadan önce bilmen lazım.
- Sınavdan sonra bulguları hem hızlı okursun hem **yargılayabilirsin**. Değerlendiremediğin
  bulguyu körlemesine kabul edersin.

Adım 2'de sadece `Durum` satırına ve `§8`'e bakıyorsun — ikisinde de bulgu içeriği yok,
sınavı kirletmez.

**Tek istisna:** prod'da acil bir şey varsa önce düzeltirsin. O zaman sınav geçersizdir ve
`§5`'e yazılır: *"sınav bulgular okunduktan sonra yapıldı — skor geçerli değil"*. Sessizce
geçme.

Analist kolu sınavdan bağımsız — `ANALISTE-GIDECEK.md`'de bulgu yok, seni kirletmez.
Analistleri bekletme, sınavdan önce gönder.

**Analistler `SONUC.md`'yi hiç görmez.** İçinde dosya yolu, satır numarası, mercek kodu
ve güven puanı var — hem işlerine yaramaz hem gereksiz endişe yaratır. Onlara giden tek
şey Confluence sayfasıdır.

---

## 1. Task notu

Aşağıyı olduğu gibi kopyala. **Üç satır** değişir, gerisi sabit.

```
Bu bir DOĞRULAMA görevidir. Ürün kodu YAZMAYACAKSIN.

Repo kökündeki .claude/skills/dv-dogrula/SKILL.md dosyasını oku ve oradaki kapıları
sırayla uygula.

Analiz dokümanı : ekteki analiz.md
Kapsam          : develop ile bu branch arasındaki diff
Konu            : kredi-limit-artirimi

YASAK:
- Ürün kodunda tek satır değişiklik. Bulgu bulsan bile DÜZELTME, sadece raporla.
- Test dosyası yazmak veya var olanı değiştirmek.
- Bulguyu kendin üretmek veya elemek. Üretmek dv-celiskici'nin, elemek
  dv-curutucu'nun işi.

Yazma izni olan tek yer: dogrulama/2026-08-23-kredi-limit-artirimi/ klasörü.

PLAN AŞAMASINDA bana şunları göster ve onay iste:
1. Belirlediğin kademe (T1/T2/T3) ve hangi tetikleyiciden (TR-x) geldiği
2. Kapsam listesi — üç başlık altında:
   DAHIL ETTIKLERIM / DAHIL ETMEDIKLERIM / EMIN OLAMADIKLARIM
3. Dosya tipi dağılımı ve koşacağın lens listesi
4. Alt agent (dv-celiskici / dv-curutucu / dv-iz-denetci) çağırabiliyor musun —
   çağıramıyorsan SIRALI MOD ile koşacağını söyle

Onaydan sonra zinciri sonuna kadar koş, dogrulama/ klasörünü commit'le ve branch'i
push'la. Değişen tek klasör dogrulama/ olmalı.
```

Sonra: `analiz.md`'yi task'a ekle → repoyu seç → gönder.

### Değişen üç satır

| Satır | Ne yazacaksın |
|---|---|
| `Analiz dokümanı` | `ekteki analiz.md` — ya da repoya commit'lediysen yolu |
| `Kapsam` | Branch varsa `<baz-dal> ile bu branch arasındaki diff`. Yoksa aşağıya bak |
| `Konu` | kebab-case, klasör adına giriyor |

Klasör yolundaki tarihi de bugüne çevir: `dogrulama/<YYYY-AA-GG>-<konu>/`

### Diff yoksa — MOD B

Branch yok, kod zaten develop'ta, ya da "şu akışı bir doğrula" diyorsun:

```
Kapsam          : diff yok — kapsamı analizden yola çıkarak sen keşfet
```

Fark: kapsamı diff değil agent çiziyor. Bu yüzden **plan onayı MOD B'de kritik** —
yanlış kapsam, yanlış kod üzerinde kusursuz çalışan bir doğrulama demek. Elinde tertemiz
bir rapor kalır ve hiçbir şey ifade etmez.

---

## 2. Planı oku

Plan böyle gelmeli:

```
1. Kademe: T1 · Tetikleyici: TR-1 (tutar), TR-6 (para hareketi akışı)
2. Kapsam:
   DAHİL ETTİKLERİM    — src/screens/LimitArtirim.tsx
                         src/hooks/useLimitKontrol.ts
                         src/api/limitService.ts
   DAHİL ETMEDİKLERİM  — src/screens/HesapOzeti.tsx (limit gösteriyor, değiştirmiyor)
   EMİN OLAMADIKLARIM  — src/config/limits.ts (sabitler burada, değişmemiş)
3. Dosya tipi: UI(1) DURUM(1) API(1) → 13 lens
4. Alt agent: var
```

### Onaylamadan önce üç kontrol

**`EMİN OLAMADIKLARIM` satırı.** Bu senin kararın, agent'ın değil. Girmesi gerekiyorsa
onay yerine şunu yaz: *"config/limits.ts'i de dahil et, öyle devam."*

**Ürün kodu değiştirme cümlesi var mı.** "Bulduğum P1'i düzelteceğim", "eksik testi
tamamlayacağım" gibi bir satır varsa **onaylama.** Düzelten taraf doğrulayamaz.

**Alt agent yok diyorsa.** SIRALI MOD'a düşecek — çalışır ama bağımsızlık zayıflar,
`SONUC.md`'ye `Bağımsızlık: ZAYIF` yazılır. Onaylayabilirsin, bilerek onayla.

### Kademe beklediğinden düşükse

Yükseltmesini iste. Tetikleyiciler `sablonlar/risk-rubrigi.md` içinde (TR-1…TR-7).
Kural asimetrik: **yükseltmek serbest, düşürmek onaylı** — çünkü yanlış yöne yapılan
hatanın bedeli eşit değil.

---

## 3. Branch'i çek, nereye yazdığını doğrula

```bash
git diff --name-only develop...HEAD | grep -v '^dogrulama/'
```

**Boş dönmeli.** Bir satır bile dönerse doğrulama ürün koduna dokunmuş: sonuç dosyası
kapatılamaz, temiz branch'te yeniden koş.

`dogrulama/` altının **dolu** olması doğru — çıktıyı alma yolun o.

---

## 4. Çıktılar

`dogrulama/<tarih>-<konu>/` altında **iki dosya** görürsün:

| Dosya | Kime | Ne yaparsın |
|---|---|---|
| `SONUC.md` | Sana | **Sadece bunu oku.** Başka bir şey açmana gerek yok |
| `ANALISTE-GIDECEK.md` | Analistlere | Confluence'a yapıştır |

Bir de `ic/` klasörü var — ara dosyalar ve denetim izi. Günlük iş için açmana gerek yok;
`SONUC.md` hepsine özet ve referans veriyor. İçinde ne olduğu `ic/OKUBENI.md`'de yazıyor.

### `SONUC.md`'yi nasıl okursun

Hepsini okumana gerek yok. Dört durak yeter:

| Durak | Ne zaman | Nereye bakarsın | Kararın |
|---|---|---|---|
| 1 | Hemen | İlk iki satır — durum ve sebep | Merge edilebilir mi |
| 2 | Hemen | §8 sağlık işaretleri | Doğrulama gerçekten koştu mu (`okunan dosya: 0` → koşmadı) |
| — | | **▶ Burada kavrayış sınavını yap** | |
| 3 | Sınavdan sonra | §1'de `❌` ve `➕` tabloları | `❌` → analiste sor · `➕` → gereksiz iş mi, gizli risk mi |
| 4 | Sınavdan sonra | §2'de sadece **Ciddi** satırlar | Düzelt |

Durak 1 ve 2'de bulgu **içeriği** yok — sadece "koştu mu, kaç tane var". Sınavı
kirletmez. §2'yi sınavdan önce okursan skor anlamını kaybeder.

Gerisi (§3 kontroller, §5 sınav sonucu, §4 manuel test) sırası geldiğinde okunur.

**`ic/` ne zaman açılır:** bir bulguya itiraz edeceğin zaman.
`ic/bulgular-curutulmus.md` içinde bulgunun tam hâli, kod alıntısı ve **çürütme
denemesi** var — "şunu denedim, şu yüzden ayakta kaldı". İkna olmazsan gerekçesi orada.

### `SONUC.md` ne içeriyor

Tek dosya, sırayla:

| Bölüm | Ne söylüyor |
|---|---|
| Durum + **Ne yapmalısın** | İlk ekran. Kapandı mı, kapanmadıysa neden, sırada ne var |
| Özet | Değişiklik, risk kademesi, nasıl bakıldı, süre |
| **1. Analiz ile kod tutuyor mu** | Analizdeki her istek kodda var mı |
| 2. Bulgular | Merceklerin bulduğu ve çürütmeden sağ çıkan sorunlar |
| 3. Senin yapacağın kontroller | Analistin ekrandan yapamayacağı, sende kalan kontroller |
| 4. Manuel test | Analistlere ne gitti, kaç senaryo, sonuçlar, otomatikleşebilirlik |
| 5. Kavrayış sınavı | Skor, zayıf alan, aksiyon |
| 6-7. Kalan riskler / açık sorular | Bilerek kabul edilenler ve cevabı beklenenler |
| 8. Sağlık işaretleri | Doğrulamanın gerçekten koştuğunun kanıtı |
| 9-10. İmza / geri besleme | Sen doldurursun |

İlk satır böyle görünür:

```
**Durum: KAPANMADI**
Sebep: analizde istenen 1 şey kodda yok (R-03) · 1 ciddi bulgu açık (L13-02)
```

`KAPANMADI` iken merge etme. `SONUC.md`'nin tek işlevi bu.

### §1 — "Analiz ile kod tutuyor mu" nasıl okunur

Analiz dokümanındaki her istek tek tek arandı, kodda karşılığı var mı diye.
*(Denetim dilinde bu tabloya "izlenebilirlik matrisi / RTM" denir — denetçi bu adı tanır,
sen tanımak zorunda değilsin.)*

| İşaret | Anlamı | Ne yaparsın |
|---|---|---|
| ✅ | İstenen kodda var | — |
| ⚠️ | Kısmen var | Oku, karar ver |
| ❌ | **İstenmiş ama kodda yok** | Kodu tamamla ya da analize dön |
| ❓ | Bulamadım (yalnız keşif modunda) | Kapsam dar olabilir, bak |
| ➕ | **Kodda var ama kimse istememiş** | En değerli satır |
| ⚪ | Kapsam dışı | — |

`➕` en çok atlanan. Kimse istemediği hâlde koda girmiş bir davranış — ya gereksiz iş,
ya da kimsenin test etmeyeceği bir risk. Analizde yoksa test planında da yoktur.

### §2 — Bulgu ciddiyeti

| Kelime | Anlamı |
|---|---|
| **Ciddi** | Para, veri, güvenlik veya servis riski. `SONUC.md` kapanmaz |
| Orta | Yanlış davranış, kullanıcı etkisi var. Karar senin |
| Düşük | Bakım riski. TODO'ya — `SONUC.md`'ye yazılmaz |

`#` kolonundaki kod (`L2-01`) bulguyu bulan merceği gösterir. Çözmen gerekmiyor;
tam hâlini aramak istersen `ic/bulgular-curutulmus.md` içinde aynı kodla duruyor.

---

## 5. Analist test paketi → Confluence

1. Analiz sayfasının **altında** yeni sayfa: `DV-<tarih>-<konu> Test Paketi`
2. Label: `dogrulama-test`
3. `Insert → Markup → Confluence Wiki` → `ANALISTE-GIDECEK.md` içeriğini yapıştır
4. Menü kapalıysa `ANALISTE-GIDECEK.md` içindeki HTML tablo alternatifini kullan

`(*)` işaretli satırlar **köprüden** gelir: statik analizle emin olunamayan, elle
bakılması gereken noktalar. Analist bunları atlamamalı.

**`SONUC.md` §3 Confluence'a gitmez.** İçinde dosya adı, satır numarası, lens ID, güven skoru
var. Bu bilgi dışarı çıkmaz.

### Yapıştırmadan önce bir kez gözünle oku

`ANALISTE-GIDECEK.md`'yı yazan agent kodu hiç görmez ve mekanik bir sızıntı kontrolünden geçer, ama
Confluence sayfası geri alınamaz. Şunlardan biri görünüyorsa yapıştırma:

dosya adı · uzantı (`.ts`, `.tsx`) · `fonksiyonAdı()` · kod bloğu · `L2-01` gibi kod ·
`P1`/`P2` · API yolu · `localStorage`/`WebView` gibi platform terimi

Görürsen KAPI 5.6'yı tek başına yeniden koştur — zincirin tamamını değil.

---

## 5b. Analistlere giden ikinci kanal — test paketi değil

Analistlerle **iki ayrı** konuşma var, karıştırma:

| Kanal | Ne gider | Nasıl |
|---|---|---|
| Test paketi | Koşacakları senaryolar | Confluence alt sayfası |
| **Gereksinim boşluğu** | `❌` satırları ve açık sorular | Analiz sayfasına yorum / doğrudan soru |

`❌` iki şeyden biri demek ve hangisi olduğunu sen bilemezsin:

- **Kod eksik kaldı** → senin işin, tamamlarsın
- **Gereksinim sözlü olarak düştü, analiz güncellenmedi** → analistin işi

Sorman gereken şey bu. Analiz sayfasına yorum yaz:

> Doğrulamada şu gereksinimin kodda karşılığı bulunamadı:
> *"<analizden birebir alıntı>"*
> Bu istek hâlâ geçerli mi, yoksa kapsam dışına mı çıktı?

| Cevap | Ne olur |
|---|---|
| "Geçerli" | Kodu tamamlarsın, `❌` kapanır |
| "Düştü" | `SONUC.md` §1'de satır `⚪ kapsam dışı` olur ve **kimin söylediği** yazılır |

İkinci satırdaki kayıt, altı ay sonra "bu neden yok" sorusunun tek cevabı. Sözlü kararın
yazıya döndüğü tek yer burası — atlanırsa bir dahaki doğrulamada aynı `❌` yeniden çıkar.

`SONUC.md` §7 "Açık sorular" da aynı kanaldan gider: cevabı analistten veya üründen
beklenen her şey.

---

## 5c. Analistlerden sonuç geri geldiğinde

Confluence tablosunu kopyala → `ic/analist-sonuclari.md` → `SONUC.md` §4 dolar.

**§4'ün altındaki "Otomatikleşebilirlik" bloğu:** hangi senaryolar makineyle koşulabilir,
hangileri **yapısal olarak** elle kalmak zorunda (cihaz durumu, zamana bağlı, native
köprü), ve otomasyona geçilirse hangi test hesaplarını sağlaman gerekecek.

Otomasyon henüz üretilmiyor. Bu bloğun bugünkü değeri: elle kalan senaryolar **her
sürümde** tekrar test edilmeli — kalıcı manuel yükün ne olduğunu söylüyor. Ayrıntı
`ic/otomasyon-yargisi.md`'de, tasarım `OTOMASYON-PLANI.md`'de.

Sonucun anlamı kolay karıştırılıyor, tablo şu:

| Ne oldu | Anlamı | Nereye |
|---|---|---|
| `(*)` işaretli test **KALDI** | Doğrulamanın şüphesi doğrulandı, köprü çalıştı | **Başarı hanesi** — *yakalanan* defect |
| `(*)` işaretsiz test **KALDI** | Hiçbir mercek bunu öngörmedi | `dogrulama/kacan-defectler.md` — *kaçan* defect |
| Test **GEÇTİ** | — | Kayıt Confluence'ta kalır |

İkinci satır sistemin öğrendiği tek yer. Soru: **hangi mercek kaçırdı?** Cevap ya mevcut
bir merceğe yeni kontrol maddesi olur, ya yeni bir mercek — ve beraberinde bir altın vaka
gelir. Yazılmazsa sistem öğrenmez, ritüele döner.

---

## 6. Kavrayış sınavı

Task ortamında koşmaz — canlı soru-cevap ister. Repoyu Copilot / Windsurf / erişimin
olan interaktif araçta aç:

```
/dv-kavra dogrulama/2026-08-23-kredi-limit-artirimi/
```

Rehberli turu okur, sonra **koda bakmadan** soruları cevaplarsın. Eşik: T1 ≥ 10/14,
T2 ≥ 6/8.

**Eşiğin altında kalırsan** çözüm "daha dikkatli oku" değil. İki ihtimalden biri:
kod fazla karmaşık (böl), ya da değişiklik fazla büyük (parçala). İkisi de koda bakar,
sana değil.

Bunu bulguları düzeltmeden önce öğrenmen bu yüzden önemli: kod bölünecekse yazdığın
yamalar zaten taşınacak.

Sonuç `SONUC.md`'ye işlenir. `ic/sinav-anahtari.md` dosyası **commit'lenmez** — `.gitignore`'da.

---

## Sık karşılaşılan durumlar

| Durum | Sebep | Ne yapılır |
|---|---|---|
| Plan kapsamı çok geniş, 30 dosya | Değişiklik büyük | Bölmeyi iste. Doğrulanamayan büyüklük, kavranamayan büyüklüktür |
| `okunan dosya: 0` + `bulgu: 0` | Lens gerçekten koşmadı | **"Temiz" değil, başarısız.** Yeniden koş |
| Çürütme oranı %100 | Tarama gevşek veya çürütme aşırı temkinli | `SONUC.md` içindeki uyarıyı oku, bir lensi elle kontrol et |
| Çürütme oranı %0 | Çürütme muhtemelen hiç denenmedi | Aynı — şüpheyle bak |
| RTM'de çok sayıda ❓ | MOD B'de kapsam dar kalmış | Kapsamı genişletip yeniden koş |
| Sonuç dosyası "KAPANMADI" ve P1 haklı değil | Yanlış pozitif çürütmeden kaçmış | `ic/bulgular-curutulmus.md`'deki `CURUTME_DENEMESI` alanını oku, gerekçeyi değerlendir |
| Task ürün kodunu değiştirmiş | Yasak tutmadı | Temiz branch'te yeniden koş. Tekrarlıyorsa `CLAUDE.md` bloğu repoda mı, kontrol et |
| `ANALISTE-GIDECEK.md` fazla teknik, kod parçası var | `ANALIST` görevi kodu görmüş olabilir | `SONUC.md`'de `kod dosyası okundu: 0` mı, `teknik sızıntı: 0` mı bak. Değilse KAPI 5.6'yı tek başına yeniden koştur |
| `ANALISTE-GIDECEK.md` çok uzun, 15+ senaryo | Değişiklik büyük | Paketi kısaltma. Değişikliği bölmeyi değerlendir |

---

## Hatırlatmalar

**Doğrulama kendi task'ı.** Kodlama ve doğrulama aynı notta olmaz — aynı bağlam aynı
hatalı varsayımı hem yazarken hem kontrol ederken taşır.

**Analiz zorunlu.** Onsuz çıkan şey doğrulama değil, kod okuma. Karşılaştırılacak bir
şey olmadan "doğru mu" sorusu cevaplanamaz.

**Boş rapor temiz rapor değil.** Sağlık işaretleri bunun için var; `SONUC.md`'de ilk bakılacak
yer orası.

**Kaçan defect olursa yaz.** `dogrulama/kacan-defectler.md` — hangi lens kaçırdı, neden.
Lens paketi buradan büyür. Yazılmazsa sistem öğrenmez, ritüele döner.
