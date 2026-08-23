# Nasıl Kullanılır — günlük kullanım

Elinde analiz var, kod yazıldı. Bundan sonrası burada.

Kurulum tek seferlik ve ayrı: `KURULUM-TASK-MODU.md` (terminalsiz ortam) veya
`KURULUM.md` (terminal).

---

## Akışın tamamı

```
1. Task aç, notu yapıştır, analiz.md'yi ekle, repoyu seç
2. Planı oku → kapsamı onayla
3. Bekle, branch'i çek
4. 05-fis.md oku → P1'leri kapat
5. 04a-analist-test-paketi.md → Confluence
6. Kavrayış sınavı — Copilot/Windsurf'te /dv-kavra
```

Adım 5 analistlerin, adım 6 senin. İkisi paralel gider.

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
fişe `Bağımsızlık: ZAYIF` yazılır. Onaylayabilirsin, bilerek onayla.

### Kademe beklediğinden düşükse

Yükseltmesini iste. Tetikleyiciler `sablonlar/risk-rubrigi.md` içinde (TR-1…TR-7).
Kural asimetrik: **yükseltmek serbest, düşürmek onaylı** — çünkü yanlış yöne yapılan
hatanın bedeli eşit değil.

---

## 3. Branch'i çek, nereye yazdığını doğrula

```bash
git diff --name-only develop...HEAD | grep -v '^dogrulama/'
```

**Boş dönmeli.** Bir satır bile dönerse doğrulama ürün koduna dokunmuş: fiş
kapatılamaz, temiz branch'te yeniden koş.

`dogrulama/` altının **dolu** olması doğru — çıktıyı alma yolun o.

---

## 4. Çıktılar

`dogrulama/<tarih>-<konu>/` altında:

| Dosya | Kime | Ne yaparsın |
|---|---|---|
| `05-fis.md` | Sana | **Önce bunu oku.** Tek A4, durum satırı üstte |
| `01-rtm.md` | Sana | `❌` ve `➕` satırlarına bak |
| `02-bulgular.md` | Sana | Ayakta kalan P1/P2 |
| `04a-analist-test-paketi.md` | Analistlere | Confluence'a yapıştır |
| `04b-developer-kontrol-listesi.md` | Sana | **Confluence'a gitmez** |
| `00-kapsam-onayli.md` | Denetim izi | Onayladığın kapsam |

### Fişte ne göreceksin

```
Durum: KAPATILAMADI
Sebep: RTM'de 1 adet ❌ var (R-03); L2-01 P1 bulgusu açık
```

`KAPATILAMADI` iken merge etme. Fişin tek işlevi bu.

### RTM işaretleri

| İşaret | Anlamı | Ne yaparsın |
|---|---|---|
| ✅ | Gereksinim kodda karşılanmış | — |
| ⚠️ | Kısmen karşılanmış | Oku, karar ver |
| ❌ | Analizde var, kodda **yok** | Kodu tamamla ya da analize dön |
| ❓ | Bulunamadı (yalnız MOD B) | Kapsam dar olabilir, bak |
| ➕ | Kodda var, analizde **yok** | **En değerli satır.** İstenmemiş davranış |
| ⚪ | Kapsam dışı | — |

`➕` en çok atlanan. Kimse istemediği hâlde koda girmiş bir davranış — ya gereksiz iş,
ya da kimsenin test etmeyeceği bir risk.

### Bulgu severity

| | Anlamı |
|---|---|
| **P1** | Para, veri, güvenlik veya servis riski. Fiş kapanmaz |
| **P2** | Yanlış davranış, kullanıcı etkisi var. Karar senin |
| **P3** | Bakım riski. TODO'ya |

---

## 5. Analist test paketi → Confluence

1. Analiz sayfasının **altında** yeni sayfa: `DV-<tarih>-<konu> Test Paketi`
2. Label: `dogrulama-test`
3. `Insert → Markup → Confluence Wiki` → `04a` içeriğini yapıştır
4. Menü kapalıysa `04a` içindeki HTML tablo alternatifini kullan

`(*)` işaretli satırlar **köprüden** gelir: statik analizle emin olunamayan, elle
bakılması gereken noktalar. Analist bunları atlamamalı.

**`04b` Confluence'a gitmez.** İçinde dosya adı, satır numarası, lens ID, güven skoru
var. Bu bilgi dışarı çıkmaz.

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

Sonuç fişe işlenir. `03b-viva-anahtar.md` dosyası **commit'lenmez** — `.gitignore`'da.

---

## Sık karşılaşılan durumlar

| Durum | Sebep | Ne yapılır |
|---|---|---|
| Plan kapsamı çok geniş, 30 dosya | Değişiklik büyük | Bölmeyi iste. Doğrulanamayan büyüklük, kavranamayan büyüklüktür |
| `okunan dosya: 0` + `bulgu: 0` | Lens gerçekten koşmadı | **"Temiz" değil, başarısız.** Yeniden koş |
| Çürütme oranı %100 | Tarama gevşek veya çürütme aşırı temkinli | Fişteki uyarıyı oku, bir lensi elle kontrol et |
| Çürütme oranı %0 | Çürütme muhtemelen hiç denenmedi | Aynı — şüpheyle bak |
| RTM'de çok sayıda ❓ | MOD B'de kapsam dar kalmış | Kapsamı genişletip yeniden koş |
| Fiş "KAPATILAMADI" ve P1 haklı değil | Yanlış pozitif çürütmeden kaçmış | `02-bulgular.md`'deki `CURUTME_DENEMESI` alanını oku, gerekçeyi değerlendir |
| Task ürün kodunu değiştirmiş | Yasak tutmadı | Temiz branch'te yeniden koş. Tekrarlıyorsa `CLAUDE.md` bloğu repoda mı, kontrol et |

---

## Hatırlatmalar

**Doğrulama kendi task'ı.** Kodlama ve doğrulama aynı notta olmaz — aynı bağlam aynı
hatalı varsayımı hem yazarken hem kontrol ederken taşır.

**Analiz zorunlu.** Onsuz çıkan şey doğrulama değil, kod okuma. Karşılaştırılacak bir
şey olmadan "doğru mu" sorusu cevaplanamaz.

**Boş rapor temiz rapor değil.** Sağlık işaretleri bunun için var; fişte ilk bakılacak
yer orası.

**Kaçan defect olursa yaz.** `dogrulama/kacan-defectler.md` — hangi lens kaçırdı, neden.
Lens paketi buradan büyür. Yazılmazsa sistem öğrenmez, ritüele döner.
