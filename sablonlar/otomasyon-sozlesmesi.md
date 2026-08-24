# Otomasyon Sözleşmesi — Şablon

Faz B (`/dv-otomat`) test üretirken uyacağı kurallar. Faz A'da bu dosya yalnız referans;
`GOREV: OTOMAT` yargısını buna göre verir.

Tasarım gerekçeleri: `OTOMASYON-PLANI.md` §4, §4b, §4c, §4d.

---

## 1. Koşum modeli

**Playwright · gerçek ortam · veri mock'u yok.**

Container app ve test edilecek child app lokalde ayağa kaldırılır. Senaryo gerçek
kullanıcı gibi koşar: gerçek auth, gerçek backend, gerçek render.

```javascript
// playwright.config.ts — iki webServer
webServer: [
  { command: profil.container.komut, url: profil.container.url, reuseExistingServer: true },
  { command: profil.child.komut,     url: profil.child.url,     reuseExistingServer: true },
]
```

Portlar, komutlar ve auth ortam profilinden gelir (§2). Kite gömülmez.

---

## 2. Ortam profili

Dosya: `ortam-profili.local.json` — hedef repo kökünde, **`.gitignore`'da.**

```json
{
  "container": { "url": "http://localhost:<PORT>", "komut": "<container ayağa kaldırma komutu>" },
  "child":     { "url": "http://localhost:<PORT>", "komut": "<child ayağa kaldırma komutu>" },
  "auth": {
    "yontem": "<login-formu | token-enjeksiyonu>",
    "giris_url": "<login sayfası, yöntem login-formu ise>"
  },
  "saglik_kontrolu": {
    "container": "<ayakta olduğunu anlayan en ucuz kontrol>",
    "child":     "<aynısı>"
  },
  "hesaplar": {
    "<hesap-anahtari>": { "kullanici": "$ENV:<DEGISKEN>", "parola": "$ENV:<DEGISKEN>" }
  }
}
```

**Kimlik bilgisi bu dosyaya yazılmaz.** Değerler `$ENV:` ile ortam değişkenine işaret
eder. Kit şablonu yalnız hangi anahtarların gerektiğini söyler, değerleri asla.

Hedef reponun `.gitignore`'una eklenecek satırlar §2c'nin sonunda.

### 2b. Auth — neyi üretici çıkarır, neyi sen doldurursun

Üretici repoyu okuyup çıkarabildiğini doldurur, çıkaramadığını `<DOLDUR: ...>` ile
işaretler ve **neyi okuyarak bulduğunu** raporlar.

| Çıkarabilir | Nereden | Çıkaramaz |
|---|---|---|
| Login formunun alan ve buton seçicileri | Login ekranının kodu, **kapsamdaysa** | Kimlik bilgileri |
| Token'ın yazıldığı anahtar | `localStorage`/cookie kullanımı | Hangi hesap hangi iş durumunda |
| Token'ın isteğe eklenme biçimi | `Authorization` header'ını kuran yer | OTP / MFA var mı |
| Portlar ve ayağa kaldırma komutları | `package.json` scripts, dev server config | Container app başka repodaysa login akışı |

**Seçici uydurma yasağı.** Yazılan her seçici okunmuş bir satıra bağlı olmak zorunda.
Login akışı kapsamda yoksa üretici uydurmaz, bildirir:

```
AUTH: BULUNAMADI
Login akışı kapsamdaki dosyalarda yok. Profilde auth bloğu da doldurulmamış.
auth/giris.ts elle doldurulacak; şablon bırakıldı.
```

Uydurulmuş seçici, birinci gün kırmızı yanan ve sebebi teşhis edilemeyen test demektir.
Kanıtsız beklenti, üreticinin fikridir.

**Developer akışı anlatırsa bu risk kalkar.** Anlatım task notunda değil, profilde durur —
task notu tek koşumluk, profil kalıcı. Aşağıdaki iki biçimden biri doldurulur.

**Biçim A — token API'den alınıyor (tercih edilen)**

```json
"auth": {
  "yontem": "api",
  "istek": {
    "url": "<login endpoint>",
    "method": "POST",
    "govde": { "<musteri no alanı>": "$KULLANICI", "<şifre alanı>": "$PAROLA" }
  },
  "token_yolu": "<yanıt gövdesinde token nerede, ör: data.accessToken>",
  "kullanim": { "tur": "header", "ad": "Authorization", "bicim": "Bearer <TOKEN>" },
  "ek_adim": "<OTP | yok>",
  "gecerlilik_dk": "<token kaç dakika geçerli>"
}
```

`kullanim.tur` alternatifleri: `header`, `localStorage` (+ `anahtar`), `cookie` (+ `ad`).

**Biçim A tercih edilir çünkü testler login arayüzünü hiç sürmez.** Token doğrudan alınıp
oturuma yazılır. Login ekranı değişince 15 test birden kırılmaz.

Tek istisna: **login'in kendisini test eden senaryo.** O test arayüzü sürer, diğerleri
sürmez.

**Biçim B — arayüzden giriş**

```json
"auth": {
  "yontem": "form",
  "giris_url": "<login sayfası>",
  "alanlar": { "musteri_no": "<seçici>", "sifre": "<seçici>" },
  "giris_butonu": "<seçici>",
  "basari_isareti": "<giriş başarılıysa ekranda görünen şey>",
  "ek_adim": "<OTP | yok>"
}
```

**`ek_adim` boş geçilmez.** OTP varsa ve test hesapları için atlanamıyorsa otomasyon
kurulamaz — bunu baştan bilmek, on beşinci testte keşfetmekten iyidir. Sabit OTP,
atlanabilir test hesabı ya da OTP'siz bir kanal varsa yaz.

### 2c. Oturum — hesap başına bir kez

Gerçek backend'e her testte login olmak hem yavaş hem kırılgan. Playwright `storageState`
deseni kullanılır: setup projesi her hesaba **bir kez** girer, oturumu diske yazar,
testler yükler.

Biçim A'da (token API'den) setup projesi login endpoint'ini çağırır, dönen token'ı
`kullanim` alanına göre oturuma yazar ve diske kaydeder — arayüz hiç açılmaz.
Biçim B'de aynı şeyi login formunu doldurarak yapar.

Kural "test başına bir hesap" olduğu için **hesap başına bir storage state** tutulur,
tek global değil:

```
auth/limit-50k-kullanilan-45k.json
auth/taksitli-kredi-aktif.json
```

Bu dosyalar **canlı oturum jetonu** taşır. `.gitignore`'a girmeleri kimlik bilgisi kadar
kritiktir. Kimse elle düzenlemez; bozuksa silinir, setup yeniden üretir.

`auth.gecerlilik_dk` doluysa setup, süresi dolmuş storage state'i kendi tazeler. Boşsa
tazelemez ve uzun koşumlarda testler ortadan itibaren 401 alır — bu bir bulgu değil,
oturum düşmesidir. `§4` triyajı bunu ORTAM olarak ayırır.

`sablonlar/gitignore-eki` satırları:

```
ortam-profili.local.json
.env.local
auth/
```

---

## 3. Hesap sözleşmesi

Test ne istediğini beyan eder, developer sağlar.

```javascript
test('MT-03 — limit aşan transfer reddedilir', async ({ page }) => {
  const hesap = gerekliHesap('limit-50k-kullanilan-45k');   // yoksa SKIP
  ...
});
```

Kurallar:

1. **Gereksinim iş dilinde**, senaryonun *"Ön koşul / veri"* kolonundan türetilir.
   Anahtar küçük harf-tire: `limit-50k-kullanilan-45k`.
2. **Hesap yoksa SKIP, FAIL değil.**
   `SKIP MT-03 — 'limit-50k-kullanilan-45k' profilde yok`
   Eksik veri bir bulgu değildir. Kırmızı yakarsa suite yalancı çoban olur.
3. **Test başına bir hesap.** MT-03 limiti harcarsa MT-04 etkilenmez.
4. **Koşum sonunda tüketim raporu:** hangi hesapların durumu değişti, hangileri
   tazelenmeli.

Koşum özeti üçü **ayrı** sayar:

```
12 geçti · 2 kaldı · 3 atlandı (hesap yok)
```

---

## 4. Sağlık kontrolü — her koşumun ilk adımı

Senaryolara başlamadan önce: container ayakta mı, child ayakta mı, login oluyor mu.

Geçmezse **hiçbir senaryo koşulmaz.** 15 kırmızı yerine tek net mesaj:

```
ORTAM HAZIR DEĞİL — child app :PORT yanıt vermiyor. Senaryolar koşulmadı.
```

Gerekçe: gerçek ortamda kırmızının üç sebebi olabilir — bizim kodumuz, backend, veri
kayması. Ayırmadan raporlamak yanlış pozitifle aynı şeydir.

```
KIRMIZI
   │
   ├─ ortam sağlık kontrolü geçti mi?  ─── HAYIR ──> ORTAM. Bulgu değil.
   ├─ gerekli hesap profilde var mı?   ─── HAYIR ──> ATLANDI. Bulgu değil.
   └─ ikisi de tamam                   ────────────> BULGU. Rapora girer.
```

---

## 5. Arıza enjeksiyonu

Hata yolları için tek istisna. **Veri mock'u değildir:** backend gerçekten konuşuyor,
sadece tek bir istek, tek bir testte bozuluyor.

**Ayıran kural: gerçek bir isteği bozabilirsin, başarılı bir yanıt uyduramazsın.**

| İzin verilen | Yasak |
|---|---|
| İsteği engelle / kes | 200 içinde iş değeri uydurmak (bakiye, limit, taksit) |
| Yavaşlat, zaman aşımına düşür | Backend'i hiç ayağa kaldırmadan koşmak |
| Hata statüsü (401, 500, 503) | Happy path'i enjeksiyonla geçmek |
| Bağlantıyı kes (offline) | Kalıcı, testler arası paylaşılan route handler |
| Bozuk/kesik gövde — *yalnız senaryonun konusu buysa* | Aynı testte hem enjeksiyon hem iş değeri assert'i |

Son satır: bozuk gövde uydurmak yalnız senaryo *"servis bozuk veri dönerse ne olur"*
olduğunda serbest. Orada assert edilen şey iş değeri değil, **savunma davranışı** —
çökmüyor mu, anlaşılır hata gösteriyor mu.

Analist dilinden karşılığı:

| Senaryo | Playwright |
|---|---|
| "İnternet bağlantısı yokken" | `context.setOffline(true)` |
| "Sistem yanıt vermezse" | `page.route(url, r => r.abort('failed'))` |
| "İşlem çok uzun sürerse" | `page.route(url, async r => { await bekle(30_000); r.continue() })` |
| "Sunucu hata dönerse" | `r.fulfill({ status: 500 })` |
| "Oturumunuz sonlandıysa" | `r.fulfill({ status: 401 })` |
| "Servis eksik veri dönerse" | `r.fulfill({ status: 200, body: <kesik> })` |

Kapsam kuralları:

1. **Tek URL deseni, tek test.** Global route handler yasak — sessizce diğer testlere
   sızar ve neyin gerçek koştuğunu kimse bilemez.
2. **Enjeksiyonlu test beyan eder.** Rapor ayrı sayar:
   `12 gerçek koşum · 4 arıza enjeksiyonlu · 3 atlandı`
3. **Karışık senaryo ikiye bölünür.** Hem happy path hem hata yolu içeren test, neyin
   gerçekten doğrulandığını gizler.

Beyan zorunluluğu kitin her yerindeki desenin aynısı: `Bağımsızlık: ZAYIF`,
`Sınav geçerliliği: DÜŞÜK`. Bozunmayı gizleme, etiketle.

---

## 6. Test yazım kuralları

- **Bir test = bir `MT-xx`.** Senaryo bölünmez, birleştirilmez. `R-xx ↔ MT-xx`
  izlenebilirlik zinciri buna bağlı.
- **Test adı senaryo başlığıdır:** `test('MT-03 — limit aşan transfer reddedilir', ...)`.
- **Seçici önceliği:** erişilebilirlik rolü ve etiket > `data-testid` > CSS. Analist
  senaryosu "Tutar alanına yazın" diyorsa `getByLabel('Tutar')` doğru karşılıktır.
- **Assert, senaryonun "Beklenen sonuç" kolonunun birebir karşılığıdır.** Fazlasını
  doğrulama; senaryo neyse odur.
- **Beklenen değer analizden gelir, koddan değil.** Koddan alınan beklenti, kodun
  kendini onaylamasıdır.
- **`(*)` senaryoları tur 1'de yazılmaz** — analiz beklenen değeri çivilemiyorsa
  (`TUR-2`). Analist kararından sonra regresyon testine dönüşürler.

---

## 7. Üretmeden önce — ön kapı

```
package.json / devDependencies
  ├── @playwright/test  var mı?   ──> EVET: üret
  └── yok                          ──> DUR. Test üretme.
                                       "Bu repoda Playwright yok, kurulum kararı senin."
```

**Yeni bağımlılık asla önerilmez, asla kurulmaz.** Araç varsa kullanılır, yoksa iş
yapılamaz denir.

Ortam profili yoksa testler yazılır ama koşulmaz; profil şablonu üretilir ve developer'a
hangi anahtarları doldurması gerektiği söylenir.

---

## 8. Ölçüm defteri

`ic/analist-sonuclari.md` tablosuna **`Koşan`** kolonu eklenir (faz B'de):

```markdown
| Test | Gereksinim | Odak | Koşan | Sonuç | Not |
|---|---|---|---|---|---|
| MT-01 | R-01 | | OTOMAT | GEÇTİ | |
| MT-07 | R-04 | (*) | ANALIST | KALDI | Taksit toplamı 33,33 yerine 33,32 |
```

Mevcut kural değişmiyor: `(*)` KALDI = **yakalanan** defect, `(*)` işaretsiz KALDI =
**kaçan** defect. `Koşan` kolonu sadece kimin yakaladığını ayırır — otomatın kırdığı,
analistin yakaladığı değildir.
