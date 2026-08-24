# Durum: eng review tamamlandı, kapsam kilitlendi (Faz 1 = G0+G1+G2+G4+G6 + altın vakalar).

## 1. Problem

Mevcut akış (dokunulmayacak):
1. Analist analiz yazar
2. Claude agent plan çıkarır + kodu yazar
3. Manuel user test

Boşluk: **kod yazma hızı ≫ insan doğrulama hızı**. İki ayrı problem tek problem sanılıyor:

- **Doğruluk boşluğu** — kod analize uymuyor / bug var.
- **Kavrayış boşluğu** — developer kodu savunamıyor, prod'da gece 3'te açıklayamıyor.

Kritik nokta: kavrayış boşluğu daha iyi AI özeti okuyarak KAPANMAZ. Rapor okumak pasif.
Kavrayış aktif hatırlama ister: developer cevabı **üretmeli**, tüketmemeli.
Bu yüzden AI developer'a rapor vermez — AI developer'ı **sınar**.

## 2. Kısıtlar (bunlar tasarımı belirliyor)

| # | Kısıt | Sonucu |
|---|---|---|
| K1 | Hedef ortamda hiçbir hazır skill/plugin yok. Ne yazarsak o gider. | Her şey sıfırdan yazılır. Dış makineye bağlanılmaz. |
| K2 | Taşıma yolu: GitHub. Bu repo → hedef repo. | Kurulum `git clone` + `cp -r`. Sürüm `VERSION` ile çivilenir. |
| K3 | Hedef ortamda internet/npm/pip kurulumu varsayılamaz. | **Sıfır runtime bağımlılığı.** Workflow'un tamamı markdown. |
| K4 | Sadece stok Claude Code primitifleri: Skill, Agent, Read/Grep/Glob/Bash, AskUserQuestion. | MCP, harici araç, script yok. |
| K5 | Tek model. Çapraz-model bağımsızlık yok. | Telafi: temiz context + farklı persona + farklı lens + zorunlu çürütme turu. Çapraz-model kadar güçlü değil, bu açıkça kabul ediliyor. |

## 3. Tasarım İlkeleri (pazarlığa kapalı)

| # | İlke | Neden |
|---|---|---|
| P1 | **Bağımsızlık** | Kodu yazan agent kendi kodunu review edemez — aynı hatalı varsayımı paylaşır. Doğrulayıcı temiz context alır: sadece analiz + diff. Kodlama transkriptini ASLA görmez. |
| P2 | **Analiz = oracle** | Ground truth analistin dokümanı. Doğrulama = analiz ↔ kod farkı. |
| P3 | **Ayrık türetme yolları** | Test analizden türetilir, review koddan. Aynı kaynaktan test + kod = döngüsel doğrulama, değersiz. |
| P4 | **Adversarial çerçeve** | Prompt "iyi görünüyor mu" değil, "yanlış olduğunu kanıtla". |
| P5 | **Bulgular çürütülür** | Her bulgu ikinci bir agent tarafından refute edilmeye çalışılır. Sadece hayatta kalan raporlanır. False positive AI review'a olan güveni öldürür — kaçan bug'dan daha hızlı. |
| P6 | **Risk kademeli derinlik** | Para/yetki/PII = T1 tam paket. Metin değişikliği = T3 smoke. Tek tip ağır süreç terk edilir. |
| P7 | **Zaman bütçesi** | T2 ≤ 5 dk, T1 ≤ 16 dk duvar saati. Aşılıyorsa değişiklik çok büyük — böl. |
| P8 | **Kavranamayan kod = kod kokusu** | Developer anlatamıyorsa suç developer'da değil. Basitleştir/böl. |
| P9 | **Orchestrator yargı yapmaz** | `/dv-dogrula` subagent çıktılarını yorumlamaz, filtrelemez, sadece mekanik birleştirir. Yorum yapan tek yer temiz context'teki `dv-curutucu`. (Review bulgusu A1) |
| P10 | **Sessiz başarısızlık yasak** | Her subagent sağlık işareti döndürür. Eksikse skill "DOĞRULAMA TAMAMLANMADI" yazar ve `SONUC.md`'yi imzaya kapatır. Boş rapor "temiz" sayılmaz. (Review bulgusu A3) |

## 4. Mimari

### İki çalışma modu (karar D4-A)

| | **A — Değişiklik modu** | **B — Keşif modu** |
|---|---|---|
| Girdi | analiz + diff | analiz + repo (diff yok) |
| Soru | "bu değişiklik doğru mu" | "bu özellik doğru mu / bu akışı bana öğret" |
| Kapsamı kim çizer | diff çizer, tartışmasız | `dv-iz-denetci` çizer, **developer onaylar** |
| Ne öğretir | değişikliği | tüm akışı |
| Maliyet | düşük | yüksek (çok daha fazla kod okur) |
| Ne zaman | günlük PR doğrulaması | yeni modüle girerken, eski koda hakim olurken |

`/dv-dogrula` modu kendisi seçer: diff varsa A, yoksa B. Agent'lar aynı — değişen tek şey
kapsamı kimin belirlediği. Ama bu tek fark iki yerde davranış değiştiriyor: G1'e kapsam
onayı durağı ekleniyor, RTM'e `❓ bulamadım` durumu giriyor.

**Neden onay durağı zorunlu:** B modunda kapsam yanlış çizilirse aşağıdaki her şey — RTM,
lensler, viva — yanlış kod üzerinde çalışır ve tertemiz bir rapor üretir. Sahte güvenin en
kötü hali. Diff modunda bu risk yok çünkü sınır kesin.

```
                        ┌─────────────────────────────────────────────┐
                        │  ÖNKOŞUL: /dv-dogrula YENİ oturumda koşar   │
                        │  (kodu yazan oturum kirli — skill BLOKLAR)  │
                        └─────────────────────────────────────────────┘
                                          │
  analiz.md ──┐                           ▼
              ├──────────────>  /dv-dogrula  (orchestrator, yargı yasağı P9)
  git diff ───┘                     │
                                    ├─ G0 risk triyajı ──> T1 / T2 / T3
                                    │
                                    ├─ dv-iz-denetci        [temiz ctx]
                                    │     ├─> ic/gereksinimler.md  (ID'ler bir kere çivilenir)
                                    │     ├─> ic/rtm.md            (izlenebilirlik matrisi)
                                    │     └─> 04-manuel-test.md    (RTM'den türetilmiş senaryolar)
                                    │
                                    ├─ dv-celiskici × N lens  [temiz ctx, paralel]
                                    │     └─> ham bulgular
                                    │
                                    ├─ dv-curutucu           [temiz ctx]
                                    │     ├─ P1/P2 bulgu → tekil çürütme
                                    │     └─ P3 bulgu     → toplu çürütme  (Perf1)
                                    │     └─> ic/bulgular-curutulmus.md  (hayatta kalanlar)
                                    │
                                    └─> SONUC.md (taslak, yarım)
                                              │
  /dv-kavra ──> dv-kavrayis-kocu [temiz ctx] ─┤
                    ├─> rehberli tur           │
                    └─> ic/sinav-sonucu.md ────────────┘
                                              ▼
                                     SONUC.md (tam) ──> developer imzası
```

Bağımsızlık nereden geliyor: subagent temiz context alır, kodu yazan oturumun akıl
yürütmesini göremez. Bu elimizdeki tek gerçek kaldıraç. Orchestrator'ın kendisi kirli
olabileceği için P9 + oturum tazeliği bloğu var.

## 5. Kapılar

### G0 — Risk Triyajı  (otomatik, ~2 dk)
Girdi: diff + analiz. Çıktı: risk seviyesi + hangi kapılar zorunlu.

Rubrik (herhangi biri tutarsa T1):
- Para hareketi, faiz/komisyon/kur hesabı, yuvarlama
- Kimlik doğrulama / yetkilendirme / limit kontrolü
- Müşteri PII okuma-yazma
- DB şema değişikliği / data migration
- Dış sistem entegrasyonu (core banking, ödeme, KKB…)
- Batch / zamanlanmış iş / kuyruk tüketicisi
- Eşzamanlılık, transaction sınırı değişikliği

T2 = iş mantığı ama yukarıdakiler değil. T3 = kozmetik/metin/log.

| Kapı | T1 | T2 | T3 |
|---|---|---|---|
| G1 İzlenebilirlik (RTM) | ✅ | ✅ | ✅ |
| G1b Manuel senaryolar | ✅ | ✅ | kısa |
| G2 Adversarial | ✅ 12 lens, filtresiz | ✅ 3-4 lens, dosya filtreli | — |
| G4 Kavrayış sınavı | ✅ tam | ✅ kısa | — |
| G6 Sonuç dosyası + imza | ✅ tümü commit | ✅ sonuç+RTM commit | ✅ sonuç dosyası |
| Duvar saati hedefi | ≤ 16 dk | ≤ 5 dk | ≤ 2 dk |

### G1 — İzlenebilirlik Matrisi (RTM) + Manuel Senaryolar
Agent: `dv-iz-denetci`. Girdi: **analiz dokümanı + diff**. Kod planını ve kodlama sohbetini GÖRMEZ.

Endüstri standardı adı **RTM (Requirements Traceability Matrix)** — regüle sektörlerin
(DO-178C, IEC 62304, finansal denetim) yerleşik artefaktı. Format icat edilmiyor, denetçi tanıyor.

**Gereksinim ID kontratı (karar D2-A):** `dv-iz-denetci` ilk geçişte analizi normalize edip
`ic/gereksinimler.md` yazar, ID'ler orada donar. Sonraki tüm koşular o dosyayı okur, yeniden
üretmez. Analiz sürecine hiç dokunulmaz, ama ID'ler koşudan koşuya kaymaz — "geçen sefer
R-04 eksikti, düzeldi mi" sorusu sorulabilir hale gelir.

**Keşif protokolü (sadece B modu):** diff yoksa `dv-iz-denetci` kapsamı kendisi çizer.
Üç ayrı arama yolundan gider ve birleşimini alır — tek arama yolu her zaman bir şey kaçırır:
(a) isim/sembol araması, (b) string ve sabit araması (hata mesajları, config anahtarları),
(c) veri modelinden (hangi tablo/entity ilgili, ona kim dokunuyor). Sonra giriş noktasından
veritabanına kadar çağrı zincirini, ve ters yönde çağıranları izler.

Çıktı **kapsam haritası**, üç başlık: `DAHİL ETTİKLERİM` (dosya:satır | neden | güven 1-10) ·
`DAHİL ETMEDİKLERİM` (dosya | neden hariç) · `EMİN OLAMADIKLARIM` (dosya:satır | neden şüpheli).

Sonra **DURUR**. Developer onaylamadan RTM'e, lenslere veya sınava geçilmez. Kod tabanını
developer agent'tan iyi bilir; "şu dosya da dahil" ya da "hayır o başka akış" diyecek olan o.

RTM çıktısı:

| Gereksinim | Kod (file:line) | Test | Manuel adım | Durum |
|---|---|---|---|---|
| R-01 … | … | … | MT-01 | ✅ |
| R-02 … | … | — | MT-02 | ⚠️ kısmi |
| R-03 … | — | — | — | ❌ eksik |
| R-04 … | … | … | … | ⚪ analiz güncel değil |
| R-05 … | ? | — | — | ❓ bulamadım (sadece B modu) |
| — | src/x.ts:88 | — | — | ➕ gereksinimsiz kod |

Altı durum:
- `✅` uygulanmış
- `⚠️` kısmi
- `❌` **eksik** — aradım, yok
- `❓` **bulamadım** — sadece B modu; "yok" değil, "bulamadım". Alarm değil, 30 saniyelik kontrol işi
- `➕` **gereksinimsiz kod** — kodda var, analizde yok
- `⚪` analiz güncel değil (analist sonradan sözlü değiştirmiş; developer işaretler)

`❌` ile `❓` ayrımı B modunun yaşam sigortası. A modunda "yok" kesin bir ifade — diff'in
tamamına bakıldı. B modunda aynı şey söylenemez, ve söylenirse sistem boşuna alarm üretir,
üçüncü yanlış alarmdan sonra kimse RTM'e bakmaz.

`➕` de B modunda yumuşuyor: A modunda `➕` sert bir bulgu (bu satır bu değişiklikte eklendi,
analizde yok). B modunda bulunan kod beş yıldır orada olabilir, o yüzden `➕` "incelenmeli"
seviyesine düşer ve "bu neden var" sorusuna dönüşür.

`➕` satırı en değerli çıktı: AI'ın istenmeyen davranış eklemesini, scope creep'i ve halüsine
edilmiş özelliği yakalar. Kimse buna bakmıyor.

`⚪` durumu yanlış alarm ölümünü engeller (review bulgusu A4): analist sözlü değişiklik
yaptıysa RTM "eksik" der, developer "istenmedi" der, üçüncü seferde kimse RTM'e bakmaz.
`⚪` bunu meşru bir sonuç haline getirir ve `SONUC.md`'de "analiz dışı sözlü değişiklik" alanına düşer.

Geçme şartı: `❌` yok, her `➕` gerekçelendirilmiş, her `⚪` `SONUC.md`'de kayıtlı.

### G1b — Manuel test paketi (karar D6: hedef kitle **analistler**, ortam **Confluence**)

Manuel senaryolar aynı geçişte üretilir — ayrı makine değil, RTM'in "manuel adım" kolonunun
açılmış hali. Ama **manuel testi analistler yapıyor**, developer değil. Bu iki şeyi zorunlu kılıyor:

**1. Paket ikiye bölünür.** Analist veritabanına bakamaz ve `TransferService.java:67` ile
işi olmaz. Tek paket ikisine birden hitap edemez.

| Dosya | Kime | İçerik |
|---|---|---|
| `ANALISTE-GIDECEK.md` | analistlere gider | iş dili, ekrandan yapılabilen adımlar, beklenen sonuç |
| `ic/developer-kontrolleri.md` | developer'da kalır | DB/log doğrulamaları, teknik kontroller |
| `ic/analist-sonuclari.md` | analistten döner | sonuçlar, RTM ve `SONUC.md`'ye işlenir |

**2. Çıktı Confluence'a gider.** Analiz zaten orada; test paketi analiz sayfasının alt
sayfası olur. Format: **Confluence wiki markup** birincil (Insert → Markup → Confluence Wiki
yoluyla hem Cloud hem Data Center'da yapışır), yanında okunur markdown. Analist tabloyu
sayfada doldurur — dosya gidip gelmez, Confluence sayfası canlı test kaydı olur.
Sayfa adı `DV-<tarih>-<konu> Test Paketi`, etiket `dogrulama-test`.

Analist tablosunun kolonları:
`Test` · `Gereksinim (R-ID)` · `Ön koşul / veri` · `Adımlar` · `Beklenen sonuç` · `Odak` ·
`Sonuç` (analist doldurur) · `Not` (analist doldurur)

`Gereksinim` kolonu analistin **kendi** numaralandırması — R-ID'ler onların analiz
dokümanından çıkarıldı. Ortak dil uydurulmuyor, zaten var.

`Odak` kolonu ⚠️: köprüden gelen, doğrulamada şüpheli çıkmış senaryolar. Analiste teknik
sebep söylenmez (işine yaramaz, gereksiz panik yaratır) — sadece "buraya normalden dikkatli
bak" sinyali, tek cümlelik açıklamayla.

**Kapsam beyanı** paketin başına konur: kaç gereksinimden kaçı kapsandı, kapsanmayanlar
ve neden, kaç negatif / kaç sınır senaryosu, kaç ⚠️. Şu an bu bilgi hiçbir yerde yok —
herkes "test edildi" der, ne kadarının test edildiğini kimse bilmez.

Zorunlu: negatif ve sınır senaryoları — insanların atladığı yer tam burası.

**Confluence'a gitmeyecekler:** `file:line`, lens ID'leri, severity kodları, ham bulgular.
Confluence sayfasını sandığından çok daha fazla kişi görür.

**Geri dönüş:** analist sonucu doldurur, `ic/analist-sonuclari.md`'ye alınır, iki yere bağlanır — RTM'in
"manuel adım" kolonu ve sonuç dosyası. ⚠️ işaretli bir test kaldıysa köprünün işe yaradığının kanıtı:
statik şüphe gerçek buga dönüştü ve prod'a kaçmadan yakalandı. `kacan-defectler.md`'ye
değil, başarı hanesine yazılır.

### G2 — Adversarial Doğrulama
Agent: `dv-celiskici` (lens başına bir çağrı, paralel) + `dv-curutucu`.
Temiz oturum. Çerçeve: "bu kodun yanlış olduğunu kanıtla".

Finansal uygulama lens paketi (kanonik kaynak `sablonlar/lens-paketi.md`):

| ID | Lens | Ne arar |
|---|---|---|
| L1 | Spec uyumu | sınır değerler, boş/null, off-by-one, tarih/saat dilimi |
| L2 | Para & yuvarlama | decimal mi float mu, yuvarlama modu, kuruş kaybı, kur precision |
| L3 | Transaction & idempotency | commit sınırları, retry güvenli mi, kısmi hata → rollback |
| L4 | Eşzamanlılık | race, kilit, bayat okuma, çift tıklama |
| L5 | Hata & gözlemlenebilirlik | yutulan exception, log'a PII sızması, hata kodu |
| L6 | Güvenlik & yetki | authz atlama, girdi doğrulama, enjeksiyon |
| L7 | Patlama yarıçapı | değişen fonksiyonu kim çağırıyor, geriye uyum, migration |
| L8 | Performans | N+1, indekssiz sorgu, sınırsız döngü |
| L9 | Kaynak sızıntısı | kapatılmayan connection/stream/handle, pool tükenmesi, thread sızıntısı |
| L10 | Ortam & konfigürasyon | hardcoded değer, timezone, encoding, **locale** (`toUpperCase()` Türkçe'de `i`→`İ`), dev↔prod farkı |
| L11 | Dış bağımlılık davranışı | timeout tanımlı mı, retry güvenli mi, devre kesici, dış servis yavaşlarsa ne olur |
| L12 | Bakım riski | kopyala-yapıştır ikizler (biri düzelir diğeri kalır), ölü kod, aşırı karmaşık fonksiyon |

L9-L12 D5-A ile eklendi. Ortak özellikleri: hepsi "kod kalitesi" başlığına giriyor ama
hepsi **çalışma şeklini** etkiliyor. Stil polisliği kapsam dışı — isimlendirme, girinti,
satır uzunluğu aranmıyor. L12 sadece gelecekte bug üretecek yapıları arar.

L10'un locale maddesi bu ortamda gerçek bir hata kaynağı: aynı kod dev makinede (İngilizce
locale) doğru, prod sunucusunda (Türkçe locale) yanlış çalışır. Statik okumayla yakalanır,
testle çoğu zaman yakalanmaz.

T2'de sadece L1, L5, L7 + G0'ın işaretlediği domain lensi koşar, dosya ön-filtresiyle
(L2 sadece tutar/hesap/faiz geçen dosyalara). T1'de filtre kapalı, 12 lens tam diff okur.
T1 lens sayısı 8→12 çıktığı için duvar saati hedefi 12→16 dk güncellendi; T2 filtreli
kaldığı için günlük iş yavaşlamıyor.

Her bulgu zorunlu alanlar: `file:line` · **somut senaryo** (şu girdi → şu yanlış çıktı) ·
severity · güven (1-10). Somut senaryosu olmayan bulgu atılır.

**Çürütme geçişi** (`dv-curutucu`): her bulguyu yanlışlamaya çalışır, hayatta kalan raporlanır.
Maliyet kontrolü (review bulgusu Perf1): P1/P2 bulgular tekil çürütülür, P3'ler tek agent'ta
toplu çürütülür. Yoksa 20 bulgu = 20 agent = 20 dakika = kimse koşmaz.

### G2→G1b köprüsü: şüpheyi kanıta çevir (karar D5-A)

G2 statik muhakeme yapar — kodu okur, çalıştırmaz. "Şu girdiyle şu yanlış sonuç çıkar"
derken akıl yürütüyor, deneyerek söylemiyor. Güçlü ama **kanıt değil**.

Kural: **çürütmeden sağ çıkan ama güveni 7'nin altında kalan her bulgu, otomatik olarak
bir manuel test senaryosuna dönüşür.**

```
Bulgu  L2-03 (güven 6/10)  TransferService.java:67
       tutar bölünürken kuruş kaybı olabilir, statik olarak kanıtlayamadım
   ↓
MT-07  33,33 TL'yi 3 taksite böl. Taksitlerin toplamı 33,33 TL mi?
       Beklenen: 33,33 · DB kontrolü: taksit tablosu toplamı = ana tutar
       Bağlı: R-04, L2-03
```

Üç kanıt seviyesi ve hangisinin nerede olduğu:

| Seviye | Ne kanıtlar | Nerede |
|---|---|---|
| 1 Uygunluk | kod, analizde isteneni yapıyor | G1 / RTM — statik |
| 2 Muhakeme | kod doğru çalışıyor | G2 / lensler — statik |
| 3 Kanıt | kod gerçekten çalışıyor | manuel test (Faz 1) + G3 (Faz 2) |

Köprü, 2. seviyede takılı kalan şüpheyi 3. seviyeye taşıyan tek mekanizma. Maliyeti sıfıra
yakın: hem G2 hem G1b zaten var, sadece birbirine bağlı değillerdi.

### G4 — Kavrayış Kapısı  ⭐ farklılaştırıcı  (~20-30 dk, insan)
Agent: `dv-kavrayis-kocu`. Skill: `/dv-kavra`.

**a) Rehberli tur** — AI diff için *okuma sırası* üretir:
   1 paragraf zihinsel model → sonra bağımlılık sırasıyla dosyalar → her biri için
   "bu neden var", "olmasa ne kırılırdı". Developer okur.

**b) Sözlü sınav (viva)** — AI 5-8 soru sorar, developer **koda bakmadan** cevaplar,
   AI kodla karşılaştırıp boşlukları gösterir. Sabit soru tipleri:

   | Tip | Örnek |
   |---|---|
   | Veri akışı | "kullanıcı X yapınca hangi sırayla ne çalışır?" |
   | Delta | "bu değişiklikten önce ne oluyordu, şimdi ne oluyor?" |
   | Hata | "2. adımda DB patlarsa sistem hangi durumda kalır?" |
   | Sınır | "limit tam eşitse ne olur?" |
   | Yarıçap | "bu fonksiyonu başka kim çağırıyor, etkilenir mi?" |
   | Alternatif | "neden bu yaklaşım? alternatif neydi, neden elendi?" |
   | Debug | "prod'da müşteri şikayeti gelse ilk nereye bakarsın?" |

   **B modunda soru seti değişir:** delta sorusu ("önce ne oluyordu") düşer, çünkü
   değişiklik yok. Yerine sistem soruları gelir — daha zor ve daha öğretici:
   "bu akışta en kırılgan yer neresi, neden?" · "bu kontrol üç yerde yapılıyor, neden üç yer,
   biri kaldırılsa ne olur?" · "bu kodu sıfırdan yazsan farklı ne yapardın?"
   Delta soruları değişikliği öğretir, sistem soruları sistemi. Kavrayış derdinin asıl
   cevabı ikincisi.

   Skor eşiğin altındaysa → **kodu basitleştir/böl** (P8). "Daha çok oku" değil.
   Kalan boşluklar ya kod sadeleştirme task'ı ya da doc satırı olur.

Temel dayanak: aktif hatırlama (testing effect). Pasif okumaya üstünlüğü öğrenme
literatüründe yerleşik. Rapor okutmak bu boşluğu kapatmıyor, sınav kapatıyor.

### G6 — Doğrulama `SONUC.md`'yi + İmza
Değişiklik başına tek markdown, **tek sayfa üst sınırı** (şişerse doldurulmaz):
risk seviyesi · RTM özeti (✅/⚠️/❌/➕/⚪ sayıları) · onaylanan bulgular + çözümleri ·
test kanıtı (varsa) · viva skoru · manuel sonuçlar · analiz dışı sözlü değişiklikler ·
**kalan riskler** · açık sorular · sağlık işaretleri · developer imzası.

Hem "güvenilir standart"ın somut çıktısı hem denetim izi.
PR akışı varsa sonuç dosyası PR açıklamasına yapıştırılır; yoksa repo'da dosya olarak durur.

### G3 — kapatıldı
Unit test yazımı kodlama akışının parçası; kod yazılırken zaten yazılıyor. Doğrulama
katmanının işi değil, plandan çıkarıldı. Yerine bakılacak fikir: **unit testten bağımsız,
senaryo seviyesinde test** — bu zaten G1b analist paketinin ta kendisi, sadece elle koşuluyor.
Otomatikleştirmesi TODO'da (bkz. TODOS.md #1).

## 6. Repo Yapısı

```
dogrulama-workflow/                  (bu repo → GitHub → hedef repo)
├── .claude/
│   ├── agents/
│   │   ├── dv-iz-denetci.md         G1 RTM + manuel senaryolar
│   │   ├── dv-celiskici.md          G2 lens taraması (lens parametreli)
│   │   ├── dv-curutucu.md           G2b çürütme
│   │   └── dv-kavrayis-kocu.md      G4 tur + viva
│   └── skills/
│       ├── dv-dogrula/SKILL.md      G0→G2 + G1b + sonuç dosyası
│       └── dv-kavra/SKILL.md        G4 interaktif
├── sablonlar/
│   ├── lens-paketi.md               ★ KANONİK KAYNAK (K1: DRY)
│   ├── risk-rubrigi.md              lens ID'lerine referans verir, kopyalamaz
│   └── sonuc-sablonu.md
├── testler/altin-vakalar/
│   ├── AV-1-fazla-ozellik/          {analiz.md, kod/, beklenen.md}
│   ├── AV-2-eksik-gereksinim/
│   ├── AV-3-sinir-hatasi/
│   ├── AV-4-para-float/
│   ├── AV-5-yutulan-exception/
│   └── AV-6-yanlis-pozitif-tuzagi/
├── dogrulama/                       çıktılar, değişiklik başına klasör
│   ├── <tarih>-<konu>/
│   │     ic/gereksinimler.md   ic/rtm.md   ic/bulgular-curutulmus.md   ic/sinav-sonucu.md
│   │     ANALISTE-GIDECEK.md  (Confluence'a gider)
│   │     ic/developer-kontrolleri.md
│   │     ic/analist-sonuclari.md  (analistten döner)
│   │     SONUC.md
│   └── kacan-defectler.md           geri besleme kaydı
├── KURULUM.md
├── VERSION
└── README.md
```

`dv-` öneki bilerek: hedef reponun kendi `.claude/`'ı varsa çakışmaz (review bulgusu A5).

Çıktı saklama (review bulgusu Perf3): T1'de 5 dosyanın hepsi commit'lenir (denetim izi zorunlu).
T2/T3'te sadece `ic/rtm.md` + `SONUC.md` commit, ham bulgular ve viva `.gitignore`'da lokal kalır.

## 7. Kurulum ve Taşıma (K2)

```
# Hedef repo kökünde:
git clone <github-url> /tmp/dv && cd /tmp/dv
cp -r .claude/agents/dv-*.md      <hedef-repo>/.claude/agents/
cp -r .claude/skills/dv-*         <hedef-repo>/.claude/skills/
cp -r sablonlar testler            <hedef-repo>/
cat VERSION > <hedef-repo>/.claude/DV-VERSION
```

`KURULUM.md` bunu + mevcut `.claude/` ile merge talimatını + güncelleme adımını yazar.
Sıfır bağımlılık: markdown kopyalamak dışında hiçbir şey kurulmaz (K3).

## 8. Altın Vakalar — workflow'un kendi testi

Workflow da bir yazılım. Lens paketini güncellediğinde bir şeyi bozup bozmadığını
anlamanın tek yolu bu. Yoksa lens paketi zamanla sessizce bozulur ve sen hala güvenerek
kullanırsın — hiç doğrulama yapmamaktan daha tehlikeli, çünkü yanlış güven verir.

| # | Tohum bug | Test ettiği | Yakalanmazsa ne bozuk |
|---|---|---|---|
| AV-1 | Analizde olmayan fazladan özellik | RTM `➕` | Scope creep hiç görülmüyor |
| AV-2 | Analizde var, kodda yok | RTM `❌` | Eksik gereksinim hiç görülmüyor |
| AV-3 | Limitte `>` yerine `>=` | L1 sınır lensi | Off-by-one geçiyor |
| AV-4 | Tutar toplamada `double` | L2 para lensi | Kuruş kaybı geçiyor |
| AV-5 | Boş `catch` bloğu | L5 hata lensi | Yutulan exception geçiyor |
| AV-6 | **Doğru ama garip görünen kod** | `dv-curutucu` | Yanlış pozitif üretiyorsun, güven ölür |
| AV-7 | Diff'siz repo + analiz, ilgili kod 3 dosyaya dağılmış | B modu kapsam haritası | Keşif eksik tarıyor, temiz rapor yanlış kod üzerinde |
| AV-8 | `toUpperCase()` Türkçe locale'de bozulan karşılaştırma | L10 ortam lensi | Dev'de çalışıp prod'da patlayan sınıf hiç aranmıyor |

AV-6 en değerlisi: sistemin **yanlış alarm vermediğini** test eder. Yanlış pozitif bu süreci
kaçan bug'dan daha hızlı öldürür. AV-7 D4-A kararıyla eklendi: B modunun kapsam haritası
üç dosyanın üçünü de buluyor mu, bulamadıklarını `EMİN OLAMADIKLARIM` altında dürüstçe
söylüyor mu. AV-8 D5-A ile eklendi: dev'de doğru, prod'da yanlış çalışan kod sınıfı —
statik okumayla yakalanır, testle çoğu zaman yakalanmaz.
Ayrıca köprü kontrolü AV-4 üzerinden: düşük güvenli para bulgusu manuel senaryoya
dönüşüyor mu. Her lens paketi değişikliğinden sonra 8 vaka koşulur.

## 9. Geri Besleme — ritüelleşmeyi engelleyen kısım

UAT/prod'a kaçan her defect için `dogrulama/kacan-defectler.md`'ye tek satır:
**hangi kapı kaçırdı** → o kapının lens/soru paketine yeni madde → yeni altın vaka.
Lens paketi yaşayan doküman.

İzlenecek metrikler: kaçan defect oranı · viva skor trendi · kapı başına süre ·
onaylanan bulgu / KLOC · yanlış pozitif oranı (çürütmede elenen / toplam).
Ölçmezsen çalışıp çalışmadığını bilemezsin.

## 10. Rollout

- **Faz 1** (kilitli kapsam): G0 + G1 + G1b + G2 + G4 + G6 + 6 altın vaka.
- **Pilot:** 5 gerçek değişiklik. Süreleri ölç, risk rubriğini ve viva eşiğini ayarla.
- **Faz 2:** G3 (test kanıtı) — test altyapısı netleştikten sonra.
- **Faz 3:** metrik döngüsü otomasyonu, kaçan defect analizi.

## 11. Riskler

| Risk | Önlem |
|---|---|
| Süre maliyeti, süreç terk edilir | Risk kademesi + duvar saati bütçesi (P6/P7) |
| False positive yorgunluğu | Zorunlu çürütme geçişi (P5) + AV-6 |
| AI'ın AI'ı doğrulaması = döngüsel | Temiz context (P1), orchestrator yargı yasağı (P9), spec'ten türetme (P3). Çapraz-model yok — K5'te açıkça kabul edildi. |
| Sessiz başarısızlık, sahte güven | Sağlık işaretleri + BLOK kuralı (P10) |
| Bayat analiz yanlış alarm üretir | RTM `⚪` durumu + `SONUC.md`'de sözlü değişiklik alanı |
| Ritüelleşme | Kaçan defect geri beslemesi + `SONUC.md`'nin tek sayfa kalması |
| Viva'da kopya (koda bakmak) | Sınav developer'ın kendisi için; sorular sentez ister, arama değil |
| B modunda kapsam yanlış çizilir | Zorunlu onay durağı + `EMİN OLAMADIKLARIM` başlığı + üç ayrı arama yolu + AV-7 |
| B modunda `❌` yanlış alarm üretir | `❓ bulamadım` ayrı durum; `❌` sadece A modunda kesin |
| Analist paketi kendi aracına elle kopyalanır, 3. seferde terk edilir | Confluence wiki markup üretimi — yapıştır-çalışsın; sonuç kolonu sayfada doldurulur, dosya gidip gelmez |
| Confluence sayfasından teknik detay sızar | `file:line`, lens ID, severity Confluence'a gitmez — sadece `SONUC.md` §3 developer'da kalır |
| Kurulum çakışması | `dv-` öneki + KURULUM.md merge talimatı |

## 12. NOT in scope — düşünüldü, bilerek dışarıda bırakıldı

| Konu | Neden dışarıda |
|---|---|
| Kodlama akışına dokunmak | Kullanıcının açık kısıtı. Akış sağlıklı çalışıyor. |
| Analiz sürecini değiştirmek (analistlerden ID'li format istemek) | Organizasyonel iş, ikna gerektirir. D2-A ile teknik olarak çözüldü. |
| G3 unit test kanıtı | **Kapatıldı.** Unit test kodlama akışının parçası, orada zaten yazılıyor. Doğrulama katmanının işi değil. |
| Çapraz-model doğrulama (Codex vb.) | Hedef ortamda ikinci model yok (K1). Tek model kabul edildi. |
| Mutation testing aracı kurulumu | K3 sıfır bağımlılık. Faz 2'de fallback ile. |
| CI/PR entegrasyonu, otomatik gate | PR platformu bilinmiyor. Lokal-önce tasarlandı, sonra bağlanır. |
| Metrik dashboard'u | Faz 3. Önce ham kayıt (`kacan-defectler.md`) yeter. |
| Analiz kalitesi kapısı (muğlaklık/test edilebilirlik) | Ayrı problem, ayrı skill. TODO olarak kaydedildi. |
| C modu — analizsiz kavrama ("şu modülü bana öğret", analiz dokümanı yok) | D4'te tartışıldı, A seçildi. `/dv-kavra`'nın bağımsız çalışması gerekir. TODO olarak kaydedildi. |
| Çok kullanıcılı / ekip onboarding akışı | Ekip büyüklüğü bilinmiyor. Tek developer varsayımıyla tasarlandı, ölçeklenebilir. |

## 13. Ne zaten var

**Hedef ortamda: hiçbir şey.** K1 gereği buradaki hazır makinelerin hiçbiri taşınamaz.
Bilinçli olarak vazgeçtiklerimiz ve yerine ne koyduğumuz:

| Burada var | Hedef ortamda yok → yerine |
|---|---|
| `production-audit` (adversarial + loop-until-dry + doğrulama) | `dv-celiskici` + `dv-curutucu` sıfırdan yazılıyor. Loop-until-dry basitleştirildi: tek tur + çürütme. |
| `/code-review high\|max\|ultra` | G2 lens paketi |
| `/codex` çapraz-model | Yok. K5'te kabul edildi. |
| `/cso`, `/security-review` | L6 güvenlik lensi |
| `/qa`, `/qa-only` tarayıcı otomasyonu | Manuel senaryo üretimi (G1b) — otomasyon değil, insan için Türkçe script |
| `test-driven-development`, `verification-before-completion` | Faz 2 (G3) |

Yeniden inşa edilmeyen tek şey: hiçbiri. Hepsi K1 yüzünden zorunlu.

## 14. Hata Modları

| Yol | Gerçekçi prod hatası | Test var mı | Hata yönetimi | Kullanıcı görür mü |
|---|---|---|---|---|
| `dv-iz-denetci` boş döner | Analiz dokümanı okunamadı, RTM boş, "temiz" sanılır | AV-1/AV-2 | P10 sağlık işareti → BLOK | Evet, açık BLOK mesajı |
| `dv-celiskici` lens atlar | Diff çok büyük, agent kısaltır, bulgu kaçar | AV-3/4/5 | Sağlık işaretinde `okunan_dosya` sayısı | Evet, sayı tutmazsa uyarı |
| `dv-curutucu` her şeyi çürütür | Aşırı temkinli agent tüm bulguları eler → sahte temiz | AV-6 tersi yönde | Çürütme oranı `SONUC.md`'de raporlanır; %80 üstü uyarı | Evet |
| `/dv-dogrula` kirli oturumda koşar | Bağımsızlık kaybı, önyargılı rapor | — | Oturum tazeliği kontrolü → BLOK | Evet |
| ID'ler kayar | `ic/gereksinimler.md` silinmiş/çakışmış, RTM geçmişle uyuşmaz | AV-1/AV-2 | Dosya varsa ASLA yeniden üretme kuralı | Evet, uyumsuzluk uyarısı |
| Viva skoru şişer | Developer koda bakarak cevaplar | — | **Yok — onur sistemi** | Hayır, sessiz |
| Analiz bayat | Yanlış `❌` alarmları, güven kaybı | — | `⚪` durumu | Evet |

**Kritik boşluk (test yok + hata yönetimi yok + sessiz): viva skorunun şişmesi.**
Teknik çözümü yok, olmamalı da — sınav developer'ın kendisi için. Ama `SONUC.md`'de
"viva koda bakmadan yapıldı" beyanı olacak; kendini kandırmayı en azından görünür kılar.

## 15. Paralelleştirme

| Adım | Dokunduğu modül | Bağımlı |
|---|---|---|
| S1 Şablonlar | `sablonlar/` | — |
| S2 Denetim agent'ları | `.claude/agents/` | S1 (lens paketi kanonik) |
| S3 Kavrayış agent + skill | `.claude/agents/`, `.claude/skills/dv-kavra/` | — |
| S4 Repo iskeleti + kurulum | kök (`KURULUM.md`, `VERSION`, `README`) | — |
| S5 Orchestrator skill | `.claude/skills/dv-dogrula/` | S1, S2 |
| S6 Altın vakalar | `testler/` | S2, S5 |

```
Lane A: S1 → S2 → S5        (sıralı, sablonlar/ + agents/ paylaşımlı)
Lane B: S3                  (bağımsız)
Lane C: S4                  (bağımsız)
                ↓ hepsi birleşir
Lane D: S6                  (her şeyi bekler — doğrulama turu)
```

Çalıştırma sırası: **A + B + C paralel** → birleştir → **D**.

Çakışma uyarısı: Lane A (S2) ve Lane B (S3) ikisi de `.claude/agents/` altına yazıyor.
Farklı dosyalar, ama aynı dizin — worktree kullanılırsa merge sırasında dikkat.

## Implementation Tasks
Bu review'ın bulgularından türetildi. Claude Code ile koş, bittikçe işaretle.

- [x] **T1 (P1, human: ~5h / CC: ~15dk)** — sablonlar — `lens-paketi.md` kanonik lens paketini yaz (L1-L12)
  - Surfaced by: Kod Kalitesi K1 — üç yerde tekrar eden risk bilgisi DRY ihlali; D5-A — L9-L12 eklendi
  - Files: `sablonlar/lens-paketi.md`
  - Verify: `risk-rubrigi.md` ve viva bankası lens ID'sine referans veriyor, içerik kopyalamıyor
- [x] **T2 (P1, human: ~4h / CC: ~12dk)** — sablonlar — risk rubriği + sonuç dosyası şablonu + **analist test paketi şablonu (Confluence wiki markup)**
  - Surfaced by: Kod Kalitesi K3 — şişen sonuç dosyası doldurulmaz; D6 — manuel testi analistler yapıyor, ortam Confluence
  - Files: `sablonlar/risk-rubrigi.md`, `sablonlar/sonuc-sablonu.md`, `sablonlar/analist-test-paketi.md`
  - Verify: sonuç dosyası tek A4'e sığıyor; test paketi şablonu Confluence'a yapıştırıldığında tablo olarak render oluyor, Sonuç ve Not kolonları boş
- [x] **T3 (P1, human: ~1g / CC: ~25dk)** — agents — `dv-iz-denetci` (RTM 6 durum + ID çivileme + manuel senaryolar + B modu keşif protokolü)
  - Surfaced by: Mimari A2 — gereksinim ID kontratı tanımsızdı (D2-A); D4-A — keşif modu
  - Files: `.claude/agents/dv-iz-denetci.md`
  - Verify: AV-1/AV-2'de `➕` ve `❌` üretiyor; AV-7'de kapsam haritası 3 dosyayı da buluyor ve onay durağında duruyor; `ANALISTE-GIDECEK.md`/`SONUC.md` §3 ayrı üretiliyor ve `ANALISTE-GIDECEK.md` içinde hiç `file:line` geçmiyor
- [x] **T4 (P1, human: ~4h / CC: ~15dk)** — agents — `dv-celiskici` (lens parametreli, somut senaryo zorunlu)
  - Surfaced by: G2 tasarımı; K1 gereği sıfırdan yazılıyor
  - Files: `.claude/agents/dv-celiskici.md`
  - Verify: AV-3/4/5'te ilgili lens bulguyu `file:line` + senaryo ile üretiyor; AV-8'de L10 locale bulgusunu üretiyor
- [x] **T5 (P1, human: ~3h / CC: ~10dk)** — agents — `dv-curutucu` (P1/P2 tekil, P3 toplu)
  - Surfaced by: Performans Perf1 — bulgu başına agent N+1 deseni
  - Files: `.claude/agents/dv-curutucu.md`
  - Verify: AV-6'da sahte bulgu eleniyor, AV-3'te gerçek bulgu ayakta kalıyor
- [x] **T6 (P1, human: ~5h / CC: ~20dk)** — skills — `/dv-dogrula` orchestrator
  - Surfaced by: Mimari A1 (oturum tazeliği bloğu + P9 yargı yasağı), A3 (P10 sağlık işareti BLOK)
  - Files: `.claude/skills/dv-dogrula/SKILL.md`
  - Verify: kirli oturumda BLOK veriyor; subagent boş dönünce "DOĞRULAMA TAMAMLANMADI" yazıyor; diff yoksa B moduna geçip kapsam onayı bekliyor; güveni 7 altı her bulgu için MT-xx senaryosu üretiyor (G2→G1b köprüsü)
- [x] **T7 (P1, human: ~4h / CC: ~15dk)** — kavrayış — `dv-kavrayis-kocu` + `/dv-kavra`
  - Surfaced by: G4 — planın farklılaştırıcı parçası
  - Files: `.claude/agents/dv-kavrayis-kocu.md`, `.claude/skills/dv-kavra/SKILL.md`
  - Verify: A modunda 7 soru tipinin her birinden en az 1 soru üretiyor; B modunda delta sorusu yerine sistem sorularına geçiyor; eşik altında basitleştirme öneriyor
- [x] **T8 (P1, human: ~1.5g / CC: ~30dk)** — testler — 8 altın vaka (analiz + kod + beklenen çıktı)
  - Surfaced by: Test Review — workflow'un kendi testi yoktu; AV-7 D4-A'dan, AV-8 D5-A'dan
  - Files: `testler/altin-vakalar/AV-{1..8}/`
  - Verify: `/dv-dogrula` 8 vakanın 8'inde beklenen sonucu üretiyor; AV-4 köprüyü de doğruluyor
- [x] **T9 (P2, human: ~2h / CC: ~8dk)** — kurulum — `KURULUM.md` + `VERSION` + `README.md`
  - Surfaced by: Mimari A5 — kurulum çakışması, dağıtım planda hiç yoktu
  - Files: `KURULUM.md`, `VERSION`, `README.md`
  - Verify: mevcut `.claude/` olan bir repo'ya merge talimatı çalışıyor
- [x] **T10 (P2, human: ~1h / CC: ~5dk)** — geri besleme — `dogrulama/kacan-defectler.md` + metrik alanları
  - Surfaced by: Bölüm 9 — ritüelleşmeyi engelleyen tek mekanizma
  - Files: `dogrulama/kacan-defectler.md`
  - Verify: sonuç dosyası şablonunda "hangi kapı kaçırdı" alanı var
- [x] **T11 (P2, human: ~1h / CC: ~5dk)** — çıktı saklama — `.gitignore` + T1/T2/T3 saklama kuralı
  - Surfaced by: Performans Perf3 — repo şişmesi
  - Files: `.gitignore`, `KURULUM.md`
  - Verify: T2 koşusunda sadece `ic/rtm.md` ve `SONUC.md` commit'e giriyor
- [ ] **T12 (P3, human: ~2h / CC: ~10dk)** — pilot — 5 gerçek değişiklikte koş, rubrik/eşik ayarla
  - Surfaced by: Bölüm 10 rollout
  - Files: `sablonlar/risk-rubrigi.md`, `sablonlar/lens-paketi.md`
  - Verify: T2 koşusu ≤ 5 dk, T1 ≤ 12 dk

## GSTACK REVIEW REPORT

| Aşama | Durum | Bulgu |
|---|---|---|
| Step 0 — Scope Challenge | Kapsam daraltıldı (D1-B) | 13 artefakt → 9; G3 faz 2'ye, G5 G1'e gömüldü |
| Bölüm 1 — Mimari | 6 bulgu | A1 orchestrator bağımsızlığı (P1), A2 ID kontratı (P1), A3 sessiz başarısızlık (P2), A4 bayat analiz (P2), A5 kurulum çakışması (P2), A6 git yokluğu (P3) |
| Bölüm 2 — Kod Kalitesi | 4 bulgu | K1 DRY lens tekrarı (P1), K2 agent kapsam kaçırma (P2), K3 sonuç dosyası şişmesi (P2), K4 çıktı dili (P3) |
| Bölüm 3 — Test | Diyagram üretildi, 34 boşluk | Workflow'un kendi testi yoktu; 6 altın vaka eklendi (D3-A) |
| Bölüm 4 — Performans | 4 bulgu | Perf1 çürütme N+1 (P1), Perf2 diff 8x okuma (P2), Perf3 repo şişmesi (P2), Perf4 duvar saati bütçesi (P3) |
| NOT in scope | Yazıldı | 9 kalem |
| Ne zaten var | Yazıldı | K1 gereği hedef ortamda hiçbiri yok, hepsi yeniden inşa |
| Hata modları | 7 mod, 1 kritik boşluk | Viva skoru şişmesi: test yok + hata yönetimi yok + sessiz |
| Paralelleştirme | 3 paralel lane + 1 sıralı | A(S1→S2→S5) ∥ B(S3) ∥ C(S4) → D(S6) |
| Ek tur — Keşif modu | 1 boşluk kapatıldı (D4-A) | Plan sadece diff modunu varsayıyordu; B modu (analiz + repo), kapsam onay durağı, `❓` durumu, B modu viva soruları ve AV-7 eklendi |
| Ek tur — Çalışma doğruluğu | 1 boşluk + 4 lens (D5-A) | Statik muhakeme kanıt değildi; G2→G1b köprüsü eklendi (güven <7 bulgu → manuel senaryo). Lens paketi 8→12: L9 kaynak sızıntısı, L10 ortam/locale, L11 dış bağımlılık, L12 bakım riski. T1 duvar saati 12→16 dk |
| Ek tur — Analist devri | 2 boşluk kapatıldı (D6) | Manuel testi analistler yapıyor: paket `ANALISTE-GIDECEK.md`/`SONUC.md` §3/`ic/analist-sonuclari.md` olarak bölündü, çıktı Confluence wiki markup, kapsam beyanı eklendi, teknik detay Confluence'a çıkmıyor. G3 (unit test) plandan kapatıldı — kodlama akışının parçası |
| Ek tur — Stack uyarlaması | Lens paketi yeniden yazıldı (D7-C) | Hedef mimari netleşti: native kabuk (Swift/Kotlin) + WebView'da React MFE. Lens paketi 12→16, backend varsayımları kaldırıldı. Yeni: L13 React render/durum, L14 WebView↔native köprü, L15 MFE sınırı, L16 mobil UX/erişilebilirlik. Lens seçimi **kademe × dosya tipi** matrisine geçti — 16 lens, ama tipe göre seçildiği için süre bütçesi korundu. Risk rubriği tetikleyicileri frontend'e uyarlandı (TR-4 köprü sözleşmesi, TR-5 MFE altyapısı). Altın vakalar 8→10, hepsi React/TS'e çevrildi |
| Ek tur — Çoklu WebView | L15 yeniden yazıldı (D8) | Module Federation kullanılmıyor; her MFE ayrı WebView. L15 "MFE sınırı ve yükleme"den "Çoklu WebView sınırı ve MFE devri"ne dönüştü: paylaşılan bağımlılık/iki React kopyası/CSS sızması maddeleri düştü, yerine oturum devri, WebView öldürülmesi, soğuk başlangıç, cache/origin ayrımı, sürüm tutarsızlığı geldi. Yeni genel kural: **native taraf kapsam dışıdır** — native davranışına dayanan bulgu güven ≤ 6 ile yazılır ve köprüden manuel teste gider. TR-5 tetikleyicisi ve KABUK dosya tipi tanımı güncellendi. Altın vaka 10→11 (AV-10 oturum devri, AV-11 WebView öldürülmesi) |
| Ek tur — Kapsam netleşmesi | L14/L15 yeniden odaklandı (D9) | Sadece React yazılıyor; native kabuk başka bir ekibin ve **kapsam dışı**. L14 "native köprü sözleşmesi denetimi"nden "köprü çağrısında bizim savunmamız"a, L15 "çoklu WebView sınırı"ndan "oturum ve durum dayanıklılığı"na daraltıldı. Native davranışı hakkındaki tüm spekülatif kontroller (bellek, WebView öldürülme mekaniği, cache/origin, veri deposu paylaşımı) çıkarıldı. Yeni kanonik kural: **bulgu her zaman bizim kodumuzda olur** — ölçüt "düzeltmesi bizim repomuzda yapılabiliyor mu". Önceki turda konulan "native bulgusu güven ≤ 6" kuralı kaldırıldı; yerine "native hakkında bulgu yazma, bizim varsayımımız hakkında yaz, o zaman güven yüksek olabilir" geldi |
| Ek tur — Task tabanlı ortam | 4 kırılma + 2 kazanım (D10) | Hedef ortamda terminal yok: task açılıyor, nota prompt yazılıyor, dosya ekleniyor, repo seçiliyor, **zorunlu plan onayı**ndan sonra çalışıyor. Dört kırılma: (1) `/dv-kavra` interaktif döngü istiyor — bu ortamda koşmaz, developer Copilot/Windsurf gibi canlı bir araçta kendi koşar; (2) platform plan onayından sonra **kodlamaya** geçmek üzere tasarlı — ürün koduna dokunma yasağı skill'e, nota ve repo `CLAUDE.md`'sine yazıldı; (3) `.gitignore` çıktıyı lokal tutuyordu — task modunda commit tek görüntüleme yolu, varsayılan tersine çevrildi; (4) alt agent desteği belirsiz — `SIRALI MOD` fallback eklendi (lensler tek tek, çürütme ayrı geçiş, `SONUC.md`'ye `Bağımsızlık: ZAYIF`). İki kazanım: platformun zorunlu plan onayı **KAPI 2 kapsam onayının yerine geçiyor**, ve her task temiz bağlam olduğu için KAPI 0 oturum tazeliği yapısal olarak sağlanıyor (kural sadeleşti: doğrulama kendi task'ıdır). Yeni dosyalar: `KURULUM-TASK-MODU.md`, `sablonlar/task-notu.md`, `sablonlar/repo-CLAUDE.md`. `SONUC.md`'ye `## Bağımsızlık` bölümü (ortam / alt agent / durum) eklendi |
| Ek tur — Analist dili (D11) | `ANALISTE-GIDECEK.md` üretimi ayrıldı | İlk gerçek koşumun geri bildirimi: analistlere giden paket fazla teknikti, kod parçası içeriyordu. Kök sebep yapısal — `ANALISTE-GIDECEK.md`, RTM ile aynı geçişte, her dosyayı okumuş bir bağlamda yazılıyordu; yasak listesi o bağlamda tutmuyor. Çözüm kural değil ayrım: yeni `GOREV: ANALIST` **kodu hiç görmeden** çalışır, girdisi yalnız analiz dokümanı + `ic/analist-girdisi.md` (iş dilinde devir dosyası). `GOREV: RTM` artık `SONUC.md` §3 ve `ic/analist-girdisi.md` üretiyor, `GOREV: KOPRU` senaryolarını `ic/analist-girdisi.md`'ye yazıyor. Yeni KAPI 5.7 en sonda `ANALISTE-GIDECEK.md`'yı üretiyor ve `OKUNAN_KOD_DOSYASI: 0` · `TEKNIK_SIZINTI: 0` sağlık işaretlerini zorunlu kılıyor. Şablona üç ekleme: dil dönüşüm tablosu (teknik gerçek → analist dili), önce/sonra örnekleri, yayın öncesi mekanik `grep` kontrolü. Yazım kurallarına baş parmak testi, ekranda görünürlük ve 5 adım / 15 senaryo üst sınırı eklendi. AV-4 bu regresyonun altın vakası oldu |
| Ek tur — Otomasyon (D12-D17) | Yargı katmanı + agent ayrımı + 1 altın vaka | Soru: analist senaryoları otomatikleşir mi? Cevap: evet, ama `ANALISTE-GIDECEK.md`'den değil — o dosya kodu görmemiş bir bağlamda üretiliyor, seçici/rota içermiyor ve içermemeli. Otomasyon `ic/rtm.md` + `ic/analist-girdisi.md` + koddan beslenir. İşe iki fazda bölündü: **faz A** yargı katmanı (bu tur), **faz B** üretici. Yargı `ic/analist-girdisi.md`'ye YAZILMADI — o dosya analist agent'ının girdisi, teknik gerekçe oraya girerse v0.6.0 sızıntı düzeltmesi geri açılırdı ve iki koruma da (`OKUNAN_KOD_DOSYASI`, §3b grep) yakalamazdı. Ayrı dosya: `ic/otomasyon-yargisi.md`. Yeni `GOREV: OTOMAT` + **koşulsuz** KAPI 5.6 — KOPRU'ya katlanamaz, çünkü KOPRU temiz koşumlarda atlanıyor ve yargı sessizce hiç üretilmezdi (kritik gap, AV-6'ya bağlandı). Review sırasında ayrı bir açık bulundu: `dv-iz-denetci` ANALIST görevine `Grep`/`Glob` veriyor ve aynı dosyada kullanmamasını söylüyordu; görev `dv-analist-paketi` agent'ına taşındı, `tools: Read, Write` — kural yetenek sınırına döndü. Koşum modeli: **Playwright, gerçek ortam, veri mock'u yok** (RTL senaryoyu bölüp `R-xx ↔ MT-xx` zincirini kırıyor). Test verisi: test hesap gereksinimini beyan eder, developer sağlar; eksik hesap SKIP olur, FAIL değil. Hata yolları **arıza enjeksiyonuyla** otomatikleşir — gerçek isteği bozabilir, başarılı yanıt uyduramaz. AV-12 yargının karar dallarını sınıyor; en tehlikeli hata emin olmadığı yerde `EVET` demesi |
| Ek tur — Çıktı sadeleştirme (D12) | 15 dosya → 2 görünür dosya | Geri bildirim: çıktı fazla dağınık, dosya adları jargon ("RTM nedir"). Bilgi kaybı olmadan birleştirildi. `SONUC.md` tek okunacak dosya oldu — eski `05-fis` + `01-rtm` + `02-bulgular` özeti + `04b` kontrol listesi + manuel test durumu + sınav sonucu tek yerde, "Durum" ve "Ne yapmalısın" en üstte. `04a` → `ANALISTE-GIDECEK.md` (adı ne olduğunu söylüyor). Kalan her şey `ic/` altına indi ve Türkçeleşti: `gereksinimler.md`, `rtm.md`, `bulgular-ham.md`, `bulgular-curutulmus.md`, `developer-kontrolleri.md`, `analist-girdisi.md`, `analist-sonuclari.md`, `tur.md`, `sinav-anahtari.md`, `sinav-sonucu.md`, `kapsam.md`, `analiz.md` — her biri `ic/OKUBENI.md`'de tek satırla açıklanıyor. Terminoloji sadeleşti: "fiş" → sonuç dosyası, `KAPATILAMADI` → `KAPANMADI`, P1/P2/P3 → **Ciddi/Orta/Düşük** (kod parantezde kalıyor, agent sözleşmeleri bozulmadı). RTM adı korunmuyor ama açıklanıyor: "Analiz ile kod tutuyor mu — denetim dilinde izlenebilirlik matrisi". Gereksinim ID'leri (`R-xx`) ve bulgu ID'leri (`L2-01`) değişmedi; çivilenmiş veriyi kırmamak için |
| Ek tur — Analist geri bildirimi (D18) | Paket biçimi + KAPI 5.6/5.7 takası + AV-13 | Analistlerden altı madde geldi: tekrar senaryolar, gereksinim tablosu yok, `(*)` anlaşılmıyor, hesap koşulu belirtilmiyor, tablo bölünmemiş, beklenen sonuç yüzeysel + otomasyon kanıtı. Review bunlardan bağımsız **var olan bir hata** ortaya çıkardı: `GOREV: OTOMAT` analist paketinden ÖNCE koşuyordu ve henüz atanmamış `MT-xx` numaralarına yargı yazıyordu — senaryo kümesini ikinci kez türetip numara tahmin ediyordu. İki türetme aynı kurallardan çıktığı sürece tutuyordu; tekrar eleme (F3) ve akış varyantı (F1) devreye girince ayrışacaktı ve faz B yanlış senaryoya test yazacaktı. Kapılar takas edildi: **5.6 analist paketi, 5.7 otomasyon yargısı**; yargının girdisine `ANALISTE-GIDECEK.md` eklendi ve `ESLESMEYEN_MT: 0` nöbetçi kapısı kondu. AV-12'deki *"numaralar koşuma göre değişir"* kaçamağı kalktı. Yan kazanç: `dv-analist-paketi`'nin otomasyon yargısını okuma yasağı ilk koşumda yapısal hale geldi — dosya henüz yok. Biçim kararı (D1): okuma yapısı **fonksiyonel bölüm**, koşum yapısı **hesap koşulu**, ayrı tablolar — F1'in derdi koşum sırası, F5'in derdi kapsam; tek tabloyu ikisine zorlamak ikisini de bozuyordu. F1'in asıl birimi müşteri tipi değil hesap koşulu çıktı ("tüzel+limiti dolu" ile "tüzel+limiti boş" ayrı hesap). Tekrar eleme kuralı: **hesap koşulu VE adımlar VE beklenen sonuç** üçü birden eşleşirse aynı; birleşmede `(*)` hayatta kalır — düşerse yakalanan defect kaçan sayılır ve kitin tek metriği sessizce bozulur. Naif varyant çoğaltması elemeyle yakalanamaz (hesap koşulları farklı), o yüzden §2d kaynağında durduruyor. Beklenen sonuç üç parçalı: ne görünür / nerede / **ne değişmemeli** — üçüncüsü regresyonların çoğunu yakalar ve ayrıntı ikinci assert demek değil. Kanıt: GEÇTİ `afterEach`'te, KALDI Playwright'ın kendi kırılma-anı görüntüsünde, ATLANDI'da hiç (login ekranı kanıt sanılmasın). Müşteri numarası kolonu boş gider — kişisel veri; `MUSTERI_NO_YAZILDI: 0` kapısı ve `[0-9]{6,}` grep'i eklendi. AV-13 elemeyi test ediyor: başarısızlık biçimi *sessiz senaryo kaybı*, paket kısalır ve tertemiz görünür |
| Dış ses | Atlandı | Codex kurulu değil (`CODEX_MODE: not_installed`) |

**VERDICT:** Plan onaylandı, 14 bulgunun tamamı plana katlandı. Kapsam Faz 1'e daraltıldı,
altın vakalar eklendi, gereksinim ID kontratı D2-A ile çözüldü. Tek kritik açık: viva
skorunun şişmesi teknik olarak kapatılamaz, `SONUC.md` içindeki beyanla görünür kılındı.

**Kararlar:** D1-B (Faz 1 kapsamı) · D2-A (ID'leri agent bir kere çivilesin) · D3-A (altın vakalar) ·
D4-A (A ve B modu birlikte, C modu TODO'ya) · D5-A (L9-L12 lensleri + G2→G1b köprüsü) ·
D6 (analist paketi Confluence'a, G3 kapatıldı) · D7-C (native kabuk + WebView'da React MFE;
lens paketi 16 lense yeniden yazıldı, dosya tipi ekseni eklendi) ·
D8 (Module Federation yok, her MFE ayrı WebView) ·
D9 (yalnız React kapsamda, native kabuk kapsam dışı — bulgu her zaman bizim kodumuzda) ·
D10 (hedef ortam task tabanlı: plan onayı = kapsam onayı, ürün koduna dokunma yasağı,
SIRALI MOD fallback; kavrayış sınavı ortam dışında interaktif araçta koşar) ·
D11 (analist paketi kodu görmeyen ayrı bir bağlamda üretilir — yasak listesi değil ayrım) ·
D12 (çıktı iki görünür dosyaya indirildi: SONUC.md + ANALISTE-GIDECEK.md, gerisi ic/ altında)

NO UNRESOLVED DECISIONS
