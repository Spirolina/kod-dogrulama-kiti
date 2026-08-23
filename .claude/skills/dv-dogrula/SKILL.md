---
name: dv-dogrula
description: Kod doğrulama zinciri. Analiz ile kodu karşılaştırır (RTM), dosya tipine göre seçilen lenslerle adversarial tarar, bulguları çürütür, analistlere Türkçe manuel test paketi üretir ve doğrulama fişini hazırlar. Diff varsa A modunda, yoksa kapsamı keşfedip B modunda çalışır. YENİ bir oturumda koşulmalıdır.
---

# /dv-dogrula — Doğrulama Zinciri (G0 → G2 + G1b)

Kod yazıldıktan sonra, merge'den önce koşulur. Kodlama akışına dokunmaz.

Bu skill **hiçbir bulguyu kendisi üretmez ve kendisi yorumlamaz.** İşi: kademeyi belirlemek,
doğru agent'ları doğru girdiyle çağırmak, çıktılarını **mekanik olarak** birleştirmek.

---

## İki ortam

Bu zincir iki farklı ortamda koşar. Kapılar aynıdır; ikisi arasında **üç şey** değişir.

| | Terminal (canlı oturum) | Task tabanlı (plan → onay → çalıştır) |
|---|---|---|
| Bağımsızlık | KAPI 0 oturum tazeliğini sorar | Her task temiz bağlam; kural: doğrulama kendi task'ıdır |
| Kapsam onayı | KAPI 2'de kullanıcıya sorulur | **Plan aşamasında** sorulur, platformun onayı yerine geçer |
| Çıktı | T2/T3 lokal kalabilir | Her şey commit'lenir — görmenin başka yolu yok |

Hangi ortamdasın, ilk mesajda anla:

- Kullanıcıyla iki yönlü konuşabiliyor ve `AskUserQuestion` sorabiliyorsan → **terminal**
- Sana bir not verilmiş, plan çıkarıp onay bekleyeceksen → **task**

Emin değilsen **task** varsay. Task varsayımı terminal'de fazladan bilgi göstermeye yol
açar; ters varsayım ise kapsam onayını sessizce atlar.

### Ürün koduna dokunma yasağı (her iki ortamda)

Bu skill koşarken **ürün kodunda tek satır değişiklik yapılmaz.** Bulgu bulsan bile
düzeltme; test dosyası yazma; import düzenleme, format, lint düzeltmesi yapma.

Dosya **yazman** yasak değil — çıktıyı teslim etme yolun zaten bu: klasörü yazar,
commit'ler, branch'i bırakırsın. Sınırlanan **nereye** yazdığın.

Task tabanlı platformlar plan onayından sonra ürün kodunu değiştirmek üzere
tasarlanmıştır — bu görevde o refleks yanlıştır. İki sebep:

1. **Kodlama akışına dokunmuyoruz.** Düzeltme kararı ve kodu developer'ın akışına ait.
2. **Düzelten taraf doğrulayamaz.** Bulguyu düzeltirsen sonraki kapılar senin yazdığın
   kodu kontrol eder; bağımsızlık zinciri kırılır.

Yazma izni olan tek yer: `dogrulama/<tarih>-<konu>/` klasörü.

Bitirmeden önce kendini kontrol et:

```bash
git status --porcelain | awk '{print $NF}' | grep -v '^dogrulama/'
```

Bir satır bile dönerse **dur ve bildir** — o dosyayı geri al, fişe yaz. Sessizce
commit'leme.

---

## KAPI 0 — Bağımsızlık (BLOKLAYICI)

**İlk iş bu. Başka hiçbir şey yapmadan önce.**

### Task tabanlı ortamda

Tek soru: **bu task'ın notu kod yazmamı da istiyor mu?**

"Şunu düzelt ve doğrula", "eksikleri tamamla, sonra RTM çıkar" gibi bir cümle varsa DUR:

```
BLOK — Bu task karışık.

Aynı task hem kod yazıp hem doğrularsa, aynı bağlam aynı hatalı varsayımı hem yazarken
hem kontrol ederken taşır. Doğrulamanın bağımsızlığı buradan çöker.

Yap: kodlamayı ayrı bir task'ta bitir, sonra bu task'ı sadece doğrulama notuyla aç.
```

Not sadece doğrulama istiyorsa bağımsızlık yapısal olarak sağlanmıştır — geç.

### Terminal ortamında

Kendine sor:

1. Bu oturumda bu kapsamdaki dosyalara `Edit`/`Write` ile dokundum mu?
2. Bu değişikliğin planını veya implementasyonunu bu oturumda ben mi çıkardım?
3. Bu oturumda bu değişiklik hakkında implementasyon tartışması yaptım mı?

**Herhangi biri "evet" ise DUR:**

```
BLOK — Bu oturum kirli.

Bu değişikliğin kodu/planı bu oturumda üretildi. Kendi yazdığı kodu doğrulayan bağlam,
aynı hatalı varsayımı hem yazarken hem kontrol ederken taşır — doğrulamanın bağımsızlığı
buradan çöker.

Yap: /clear (veya yeni terminal), sonra /dv-dogrula tekrar.
```

Kullanıcı "yine de devam et" derse: devam et, ama fişe `Bağımsızlık: İHLAL — kirli oturumda
koşuldu` satırını yaz. Sessizce geçme.

Emin değilsen kullanıcıya doğrudan sor: *"Bu değişikliğin kodunu bu oturumda mı yazdık?"*

### Alt agent kontrolü (her iki ortamda)

`dv-celiskici`, `dv-curutucu`, `dv-iz-denetci` agent'larını çağırabiliyor musun?

Çağıramıyorsan zincir yine koşar ama **SIRALI MOD**'a düşer (bkz. KAPI 4). Bunu şimdi
söyle, fişe `Bağımsızlık: ZAYIF — sıralı modda koşuldu` yaz. Task ortamındaysan bunu
plan aşamasında bildir; onay senin değil kullanıcının kararı.

---

## KAPI 0.5 — Girdi toplama

Gerekenler:

| Girdi | Nasıl bulunur |
|---|---|
| Analiz dokümanı | Task ekindeki dosya · not içindeki yol · `dogrulama/*/00-analiz.md` · yapıştırılmış metin. **Zorunlu.** |
| Kapsam | `git diff` çalışıyorsa → **MOD A**. Çalışmıyor/boşsa → **MOD B** |
| Konu adı | Nottan veya kullanıcıdan, kısa kebab-case |

Task ortamında analiz dosyası ek olarak geldiyse **önce onu klasöre kopyala**
(`00-analiz.md`). Ek dosyalar task'la birlikte kaybolur; RTM'in dayandığı metnin
commit'te durması gerekir. Ek yoksa notta verilen yolu oku.

```bash
git diff --stat HEAD 2>/dev/null || git diff --stat 2>/dev/null || echo "DIFF_YOK"
```

Task ortamında çalışma branch'i zaten checkout'ludur; diff için baz dalı notta verilmiş
olabilir:

```bash
git diff --stat <base-branch>...HEAD 2>/dev/null || echo "DIFF_YOK"
```

Baz dal verilmemişse **MOD B varsay ve kapsamı keşfet.** Yanlış baz dalla çıkarılan diff,
sessizce yanlış kapsam demektir — keşfetmek daha güvenli, çünkü keşfin sonu onaya çıkar.

Analiz dokümanı yoksa **dur ve iste.** Analiz bu zincirin oracle'ı; onsuz doğrulama değil,
sadece kod okuma olur.

Klasörü aç:

```bash
mkdir -p "dogrulama/$(date +%Y-%m-%d)-<konu>"
```

Modu kullanıcıya bir satırda bildir: `Mod A (diff bulundu, N dosya)` veya
`Mod B (diff yok — kapsam keşfedilecek ve sana onaylatılacak)`.

---

## KAPI 1 — G0 Risk triyajı

`sablonlar/risk-rubrigi.md` oku. Kapsamı ve analizi tetikleyicilere (TR-1…TR-7) karşı geçir.

Çıktı tek satır, kullanıcıya göster:

```
Kademe: T1 · Tetikleyici: TR-1 (para hareketi), TR-2 (limit kontrolü)
Koşulacak: 12 lens, filtresiz · Duvar saati hedefi: 16 dk
```

**Yükseltme serbest, düşürme onaylı.** Kademeyi düşürmek istiyorsan kullanıcıya sor ve
gerekçeyi fişe yaz. Yükseltmek için sorma.

Kademe fişe yazılır.

---

## KAPI 2 — B modu kapsam keşfi ve onayı

*(Yalnız MOD B. MOD A ise atla.)*

`dv-iz-denetci` agent'ını `GOREV: KAPSAM` ile çağır.
Çıktı: `00-kapsam-haritasi.md`.

Haritayı kullanıcıya **olduğu gibi** göster. Özetleme, kısaltma, yorumlama. Sonra sor:

> Bu kapsam doğru mu? Eksik aldığım var mı, fazladan aldığım var mı?
> `EMİN OLAMADIKLARIM` başlığındakiler dahil mi, hariç mi?

**Kullanıcı onaylamadan devam etme.** Bu durak atlanırsa sistem yanlış kod üzerinde kusursuz
çalışır ve tertemiz bir rapor üretir — sahte güvenin en kötü hali.

### Task tabanlı ortamda: bu kapı plan aşamasına taşınır

Platform zaten plan çıkarıp onay istiyor. Ayrı bir onay durağı kurma — **kapsam haritasını
planın içine koy.** Plan şu dört başlığı içermeli:

```
1. Kademe: T<n> · Tetikleyici: TR-x, TR-y
2. Kapsam:
   DAHİL ETTİKLERİM     — <dosya listesi>
   DAHİL ETMEDİKLERİM   — <dosya + neden>
   EMİN OLAMADIKLARIM   — <dosya + neden kararsızım>
3. Dosya tipi dağılımı ve koşacak lens listesi
4. Alt agent durumu: var | yok (SIRALI MOD)
```

Plan onaylanınca kapsam onaylanmış sayılır. Onaylanan listeyi `00-kapsam-onayli.md`
olarak yaz — sonraki agent'lar planı değil bu dosyayı okur.

Kullanıcı planı değiştirerek onaylarsa **değişmiş hali** yazılır. Planda gösterip
dosyaya başka bir şey yazmak, denetim izini yalanlar.

Onaylanan kapsamı `00-kapsam-onayli.md` olarak yaz. Sonraki tüm agent'lar bunu alır.

---

## KAPI 3 — G1 İzlenebilirlik + analist paketi

`dv-iz-denetci` agent'ını `GOREV: RTM` ile çağır.

Üretilenler: `00-gereksinimler.md`, `01-rtm.md`, `04a-analist-test-paketi.md`,
`04b-developer-kontrol-listesi.md`.

**Sağlık kontrolü:** `OKUNAN_DOSYA` > 0 ve `ARANAN_GEREKSINIM` > 0 mu? Değilse KAPI 6'ya
atla, `DOĞRULAMA TAMAMLANMADI` ile bitir.

RTM özetini kullanıcıya göster (sayılar). `❌` ve `➕` satırları varsa **tam olarak** göster —
bunlar en değerli çıktı. Yorum ekleme, sadece göster.

---

## KAPI 4 — G2 Adversarial tarama

Lens seçimi **iki eksenli**: kademe × dosya tipi (`lens-paketi.md` §3 matrisi).

**Önce dosya tiplerini belirle.** Kapsamdaki her dosyayı `lens-paketi.md` §3'teki tespit
tablosuna göre etiketle: `UI` · `DURUM` · `API` · `KOPRU` · `KABUK` · `UTIL` · `TEST`.
`TEST` kapsam dışıdır. Bir dosya birden fazla tipe girebilir.

Sonra matristen lens listesini çıkar:

- **T1:** eşleşen tiplerin `●` ve `○` lensleri, `DOSYA_FILTRESI: kapali`
- **T2:** eşleşen tiplerin yalnız `●` lensleri, `DOSYA_FILTRESI: acik`
- **T3:** lens koşma, KAPI 5'e atla

Dosya tipi dağılımını kullanıcıya bir satırda göster:
`Dosya tipi: UI(4) DURUM(2) KOPRU(1) → 11 lens koşacak`

**Üçten fazla dosya tipine dokunuluyorsa** bu bir kapsam sinyalidir: kullanıcıya söyle,
T1'e yükselt veya bölmeyi öner.

`dv-celiskici` agent'ını **her lens için ayrı ayrı** çağır. Lensler birbirinden bağımsız —
hepsini **tek mesajda, paralel** çağır. Tek agent'a 12 lens verme; bağlam şişer, lens kaçar.

Her lens dönüşünde sağlık işaretini kontrol et:
- `OKUNAN_DOSYA: 0` + `BULGU_SAYISI: 0` → o lens **başarısız**, listeye `LENS_BASARISIZ` yaz
- `ATLANAN_DOSYA > 0` → nedenini not et

Ham bulguları `02a-ham-bulgular.md` olarak birleştir. **Mekanik birleştirme** — bulgu metnini
değiştirme, severity'ye dokunma, "bu önemli değil" diye eleme. Yorum yapan tek yer KAPI 5.

### SIRALI MOD — alt agent yoksa

Ortam alt agent çağırmaya izin vermiyorsa zincir durmaz, ama şu kurallarla koşar:

1. `sablonlar/lens-paketi.md` dosyasını **her lens öncesi yeniden oku.** Hafızandan
   çalışma; 11. lense geldiğinde ilk lensin tanımı bulanıklaşır.
2. Lensleri **tek tek** koş. Bir lensin çıktısını yaz, sonra diğerine geç. İki lensi
   aynı geçişte birleştirme — birleşen lens, ikisinden de zayıf tarar.
3. Her lens için çıktı formatını (`LENS:` … `--- SON ---`) eksiksiz üret. Sağlık
   işaretleri sıralı modda daha kritik: kaçırılan lens burada görünür.
4. Çürütmeyi (KAPI 5) **ayrı bir geçişte** yap. Bulguyu üreten geçiş kendi bulgusunu
   çürütmeye çalışırsa ikisi de zayıflar.
5. Fişe `Bağımsızlık: ZAYIF — sıralı modda koşuldu` yaz.

Sıralı mod bir **düşüş**, eşdeğer değil. Aynı bağlam hem 11 lensi hem çürütmeyi taşır;
erken bulgular geç bulguları etkiler. Alt agent desteği çıkarsa geri dön.

---

## KAPI 5 — G2b Çürütme

`dv-curutucu` agent'ını çağır. Girdi: `02a-ham-bulgular.md` + kapsam.

Çıktı: `02-bulgular.md` — ayakta kalanlar, çürütülenler (gerekçeli), köprüye gidenler.

Çürütme oranını kontrol et:
- **> %80** → kullanıcıya uyar: tarama gevşek veya çürütme aşırı temkinli olabilir
- **%0** → kullanıcıya uyar: çürütme muhtemelen hiç denenmedi

---

## KAPI 5.5 — Köprü

`02-bulgular.md` içinde **güveni 7'nin altında ayakta kalmış** bulgu varsa:

`dv-iz-denetci` agent'ını `GOREV: KOPRU` ile çağır. Bu bulguları iş diline çevirip
`04a`'ya `(*)` işaretli `MT-xx` senaryoları olarak ekler, teknik sebebi `04b`'ye yazar.

Köprüden geçen bulgu yoksa bu kapıyı atla ve fişe `Köprüye giden: 0` yaz.

---

## KAPI 6 — Fiş taslağı

`sablonlar/fis-sablonu.md` şablonunu kullanarak `05-fis.md` yaz. Doldurabileceğin alanlar:
kademe, mod, sağlık işaretleri, RTM özeti, `➕` satırları, ayakta kalan P1/P2 bulgular,
köprü sayısı.

**Boş bırakılacaklar** (sen dolduramazsın): viva bölümü (`/dv-kavra` doldurur), manuel test
sonuçları (analistten gelir), imza.

Fiş kapatılamaz koşullarını kontrol et ve durumu yaz:

```
Durum: KAPATILAMADI
Sebep: RTM'de 1 adet ❌ var (R-03); L2-01 P1 bulgusu açık
```

---

## KAPI 7 — Devir

Kullanıcıya net bir kapanış ver:

```
DOĞRULAMA TAMAMLANDI · Kademe T1 · Mod A · 11 dk

RTM       ✅ 6  ⚠️ 1  ❌ 1  ➕ 2
Dosya     UI(4) DURUM(2) KOPRU(1)
Lensler   11/11 koştu · 14 bulgu · 7 ayakta · 2 köprüye
Fiş       KAPATILAMADI — R-03 eksik, L2-01 açık

Sırada:
1. R-03 eksik — analize dön veya kodu tamamla
2. L2-01 (P1) düzelt
3. 04a-analist-test-paketi.md → Confluence'a yapıştır (Insert → Markup → Confluence Wiki)
4. /dv-kavra — kavrayış sınavı
```

Task tabanlı ortamda 4. madde burada koşmaz — sınav canlı soru-cevap ister. Onun yerine:

```
4. Kavrayış sınavı: bu klasörü interaktif bir araçta (Claude Code, Copilot, Windsurf)
   aç ve /dv-kavra koş. Fişteki viva bölümü o zaman dolar.
```

Bir lens başarısız olduysa veya sağlık işareti eksikse **kapanış yerine** şunu yaz:

```
DOĞRULAMA TAMAMLANMADI
Başarısız: <lens/agent listesi>
Sebep: <sağlık işareti neyi gösteriyor>
Fiş imzaya kapatılamaz. Yeniden koş veya kapsamı daralt.
```

---

## Duvar saati

Hedef: **T1 ≤ 16 dk · T2 ≤ 5 dk · T3 ≤ 2 dk**.

Task tabanlı ortamda duvar saati anlamsızdır — kullanıcı ekranda beklemiyor. Orada
sinyal **kapsam büyüklüğü**: T1'de 25'ten, T2'de 10'dan fazla dosya okunduysa aynı
uyarıyı ver.

Aşılırsa çözüm "daha hızlı koş" değil. Kullanıcıya söyle:

> Bu değişiklik hedeflenen sürede doğrulanamadı. Muhtemel sebep: değişiklik çok büyük.
> Bölmeyi düşün — küçük parçalar hem daha hızlı doğrulanır hem kavrayış sınavında geçer.

---

## Bu skill'in yasakları

1. **Bulgu üretme.** Kodda bir sorun görsen bile yazma. Senin işin orkestrasyon.
2. **Bulgu filtreleme.** "Bu önemsiz" diye eleme. Eleme yetkisi yalnız `dv-curutucu`'da.
3. **Severity/güven değiştirme.** Agent ne yazdıysa o kalır.
4. **Boş sonucu "temiz" sayma.** Sağlık işareti yoksa sonuç yok demektir.
5. **Kapsam onayını atlama.** B modunda kullanıcı onaylamadan ilerleme.
6. **Kademe düşürmeyi kendi başına yapma.** Yükseltme serbest, düşürme onaylı.
7. **Ürün kodunu değiştirme.** Bulgu bulsan bile düzeltme, test yazma, format/lint
   düzeltmesi yapma. Yazma izni yalnız `dogrulama/<tarih>-<konu>/` altında.

## Çıktı saklama

**Task tabanlı ortamda: her şey commit'lenir.** Çıktıyı görmenin başka yolu yok —
commit'lenmeyen dosya task bitince yok olur. Kademe ayrımı burada geçersiz.

**Terminal ortamında:**

- **T1:** klasördeki tüm dosyalar commit'lenir (denetim izi zorunlu)
- **T2/T3:** yalnız `01-rtm.md` ve `05-fis.md` commit'lenebilir; kalanı lokal kalabilir

Her iki ortamda: `03b-viva-anahtar.md` **asla commit'lenmez** — sınavdan önce üretilir,
repoda dururken sınavın anlamı kalmaz.
