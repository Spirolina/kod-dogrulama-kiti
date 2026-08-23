# Lens Paketi — React MFE / WebView / Native Kabuk

**Bu dosya kanonik kaynaktır.** Risk rubriği, viva soru bankası ve agent tanımları buraya
lens ID'siyle (`L1`…`L16`) referans verir; içeriği kopyalamaz.

## Hedef mimari

```
┌───────────────────────────────────────────────────────────────┐
│  Native kabuk (Swift / Kotlin)                                │
│                                                               │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│   │  WebView 1   │   │  WebView 2   │   │  WebView 3   │      │
│   │  MFE: Hesap  │   │  MFE: Kredi  │   │  MFE: Kart   │      │
│   └──────▲───────┘   └──────▲───────┘   └──────▲───────┘      │
│          │ köprü            │ köprü            │ köprü        │
│          └──────────────────┼──────────────────┘              │
│                             ▼                                 │
│           native: oturum · durum devri · navigasyon           │
└───────────────────────────────────────────────────────────────┘
```

**Biz yalnız React tarafını yazıyoruz.** Her MFE ayrı WebView'da çalışır; native kabuk
(Swift/Kotlin) başka bir ekibin işi ve **bu doğrulamanın kapsamı dışında.** Native ile
gerektiğinde köprü üzerinden konuşuyoruz.

Bunun tek bir sonucu var ve her lensi etkiliyor:

> **Bulgu her zaman bizim kodumuzdaki bir eksikliğe işaret eder.**
> "Native şunu yapıyor olabilir" spekülasyondur, bulgu değildir.
> "Biz native'in şunu yaptığını varsayıyoruz ve varsayım tutmazsa şu kırılır" —
> bu bizim savunma eksikliğimizdir, bulgu budur.

Kodumuzun içinde bulunduğu ortamın üç gerçeği (denetlemiyoruz, ama varsayıyoruz):

- Her MFE ayrı JS bağlamı → oturum, durum, bellek içi her şey sıfırdan başlar
- Sayfa her an sıfırdan yüklenebilir (WebView tazelenir, yeniden yaratılır)
- Native ile tek iletişim yolu köprü; çağrı başarısız olabilir veya hiç cevap vermeyebilir

Üç teknik gerçek lens paketini şekillendiriyor:

1. **Sürüm asimetrisi.** Web günde bir deploy olur, native app store'dan geçer ve
   kullanıcılar aylarca güncellemez. Native'i düzeltemeyiz; **kendi tarafımızda varlık
   kontrolü (feature detection) yapabiliriz.** → L7, L14
2. **İzolasyon.** Hiçbir şey otomatik paylaşılmaz. Bizim tarafta: neyi nereden alıyoruz,
   sıfırdan yüklenirsek toparlayabiliyor muyuz? → L15
3. **JavaScript'te tüm sayılar float64.** Bu bir seçim değil, dilin kendisi. → L2

---

## 0. Çalışma kuralları

### Çerçeve
"Bu kod iyi görünüyor mu" değil, **"bu kodun yanlış olduğunu kanıtla."**
Onay arayan gözden bulgu çıkmaz.

### Somut senaryo zorunluluğu
Her bulgu: **"şu girdi/durum → şu yanlış sonuç."** Yazamıyorsan bulgu değil, his. At.

- ✗ `"Burada bir race condition olabilir"` → atılır
- ✓ `"Kullanıcı hızlıca iki hesap seçerse ilk isteğin cevabı sonra döner ve ekranda yanlış bakiye kalır"` → kalır

### Alıntı zorunluluğu
Bulguyu tetikleyen satır(lar) birebir alıntılanır. Alıntısız bulgunun güveni 4-5'e sabitlenir,
ana rapora çıkmaz.

### Stil polisliği yasak
İsimlendirme, girinti, satır uzunluğu, import sırası, prop sıralaması → **kapsam dışı.**
Sadece çalışma davranışını etkileyen veya gelecekte bug üretecek yapılar.

### Öneri yasağı
Lens bulgu üretir. Kod yazmaz, refactor önermez.

### Bulgu bizim kodumuzda olur
Native kabuk başka bir ekibin ve bu doğrulamanın kapsamı dışında. Native'in ne yaptığını
göremiyoruz ve denetlemiyoruz.

İki bulgu biçimini ayır:

| ✗ Bulgu değil | ✓ Bulgu |
|---|---|
| "Native köprüyü yanlış uygulamış olabilir" | "Köprü çağrısının başarısız olma ihtimali ele alınmamış" |
| "WebView'lar depolamayı paylaşmıyor olabilir" | "Token köprüden değil `localStorage`'dan okunuyor; kodda hiçbir yer bu anahtarı yazmıyor" |
| "Eski native sürümde bu metot yok olabilir" | "Metot varlık kontrolü yapılmadan çağrılıyor" |

Sol sütun spekülasyondur, atılır. Sağ sütun bizim kodumuzda eksik bir savunmadır ve
**alıntılanabildiği için güveni yüksek olabilir.**

Ölçüt basit: **bulgunun düzeltmesi bizim repomuzda yapılabiliyor mu?** Yapılamıyorsa
bulgu değildir.

---

## 1. Severity

| Kod | Anlam | Ne yapılır |
|---|---|---|
| **P1** | Para/veri hatası, güvenlik açığı, kullanıcının işlemi tamamlayamaması, beyaz ekran | Merge engellenir |
| **P2** | Yanlış davranış, etkisi sınırlı veya kullanıcı kurtarabiliyor | Aynı branch'te düzeltilir |
| **P3** | Risk taşıyor ama bugün patlamıyor | TODO |

Kararsızsan bir alta yaz.

## 2. Güven (1-10)

| Aralık | Anlam | Sonuç |
|---|---|---|
| 9-10 | Satırı okudum, alıntıladım, senaryo kesin | Ana rapor |
| 7-8 | Güçlü desen eşleşmesi | Ana rapor |
| **< 7** | Şüpheliyim, statik olarak kanıtlayamadım | **Köprü** → manuel test senaryosu |

Güven < 7 başarısızlık değildir; o bulgu analist paketine `(*)` işaretli senaryo olarak
girer ve elle kanıtlanır. Emin değilken 8 yazmak sistemi bozar, 6 yazmak çalıştırır.

---

## 3. Lens seçimi — iki eksen

Lens sayısı 16. Hepsini her dosyaya koşmak hem anlamsız hem bütçe dışı. Seçim
**kademe × dosya tipi** matrisinden yapılır.

### Dosya tipi tespiti

| Tip | Nasıl tanınır |
|---|---|
| **UI** bileşen | `*.tsx`/`*.jsx`, JSX döndüren, `components/`, `screens/`, `pages/` |
| **DURUM** hook/store | `use*.ts`, `hooks/`, `store/`, `context/`, `*Slice.*`, `*Atom.*` |
| **API** ağ katmanı | `api/`, `services/`, `*Client.*`, `fetch(`/`axios` içeren |
| **KOPRU** native | `bridge/`, `native/`, `webkit.messageHandlers`, `AndroidBridge`, `postMessage`, `addEventListener('message'` |
| **KABUK** giriş/bootstrap | `main.*`, `index.html`, kök `App.*`, router kurulumu, `vite.config`/`webpack.config`, ortam/config dosyaları, WebView başlangıç parametresi ve oturum bootstrap'ı |
| **UTIL** format/yardımcı | `utils/`, `format*`, `money*`, `date*`, `i18n/`, `locale*` |
| **TEST** | `*.test.*`, `*.spec.*`, `__mocks__/`, `*.stories.*` → **kapsam dışı** |

Bir dosya birden fazla tipe girebilir; lens birleşimi alınır.

### Matris

`●` zorunlu · `○` T1'de koş, T2'de atla · `—` koşma

| Lens | UI | DURUM | API | KOPRU | KABUK | UTIL |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| L1 Spec ve sınır | ● | ● | ● | ● | ○ | ● |
| L2 Para ve sayı | ○ | ○ | ● | — | — | ● |
| L3 İşlem bütünlüğü | ○ | ● | ● | ○ | — | — |
| L4 Async yarış | ○ | ● | ● | ● | ○ | — |
| L5 Hata ve gözlem | ● | ● | ● | ● | ● | ○ |
| L6 Güvenlik ve gizlilik | ● | ● | ● | ● | ○ | ● |
| L7 Sözleşme ve uyum | ○ | ○ | ● | ● | ● | — |
| L8 Performans | ● | ● | ○ | — | ● | ○ |
| L9 Yaşam döngüsü sızıntısı | ● | ● | ○ | ● | ○ | — |
| L10 Ortam, locale, cihaz | ● | ○ | ○ | ● | ○ | ● |
| L11 Ağ çağrısı davranışı | — | ○ | ● | ○ | ○ | — |
| L12 Bakım riski | ○ | ○ | ○ | ○ | ○ | ○ |
| L13 React render/durum | ● | ● | — | — | ○ | — |
| L14 Native köprü çağrısı | ○ | ○ | ○ | ● | ○ | — |
| L15 Oturum ve durum dayanıklılığı | ● | ● | ○ | ○ | ● | — |
| L16 Mobil UX ve erişilebilirlik | ● | ○ | — | ○ | ○ | — |

### Kademe

| Kademe | Ne koşar | Dosya filtresi | Duvar saati |
|---|---|---|---|
| **T1** | Matristeki `●` ve `○` lenslerin tamamı | kapalı | ≤ 16 dk |
| **T2** | Yalnız `●` lensler | açık | ≤ 5 dk |
| **T3** | Lens koşmaz | — | ≤ 2 dk |

Duvar saati aşılıyorsa çözüm "daha hızlı koş" değil, **"değişiklik çok büyük, böl."**

---

## 4. Lensler

Her lens: `Ne arar` · `Kontroller` · `Yanlış pozitif tuzakları`.
Tuzak bölümü lensin **ne zaman susacağını** söyler — bu bölüm olmadan lens gürültü üretir.
Tuzak bir susma bahanesi değildir: bir korumanın var olduğunu **görmeden** o tuzağa sığınma.

---

### L1 — Spec uyumu ve sınır değerler

**Ne arar:** Analizde tanımlı davranışın kodda tam karşılığı; sınırda kırılma.

**Kontroller:**
- Karşılaştırma yönü: analiz "aşarsa" mı "ulaşırsa" mı diyor? `>` mü `>=` mi? Tam sınırda hangi dal?
- Boş/yokluk: `null`, `undefined`, boş dizi, boş string, `0`. `if (tutar)` yazılmışsa `0` false'tur — sıfır tutarlı durum sessizce eleniyor mu?
- Optional chaining ile sessiz kayıp: `a?.b?.c` undefined dönüyor ve kimse fark etmiyor mu?
- Negatif ve aşırı büyük girdi
- Dizi: boş dizi, tek elemanlı dizi, ilk/son eleman, `find` bulamazsa `undefined`
- `Number()`/`parseFloat` NaN üretiyor mu, NaN kontrolü var mı? `NaN === NaN` false
- Analizde tanımsız girdi geldiğinde davranış

**Yanlış pozitif tuzakları:**
- Doğrulama şema katmanında (Zod/Yup) yapılıyorsa bileşende tekrar aranmaz — **şemayı okuyup gördüysen**
- TypeScript `strictNullChecks` açıksa bazı null yolları derleyicide kapalıdır; `tsconfig`'i kontrol et
- Analiz sınırı hiç belirtmemişse bu L1 bulgusu değil, **analiz eksikliğidir** → RTM'de `⚠️`

---

### L2 — Para ve sayı

**Ne arar:** JavaScript'in float aritmetiğinden doğan tutar hataları ve format tutarsızlığı.

> JS'te tüm sayılar IEEE-754 float64. Bu bir seçim değil, dilin kendisi.
> `0.1 + 0.2 === 0.30000000000000004` · `19.99 * 3 === 59.96999999999999`
> `(1.005).toFixed(2) === "1.00"` (1.01 değil — float temsili yüzünden)

**Kontroller:**
- **Frontend'de tutar aritmetiği var mı?** Toplama, çarpma, taksit bölme, komisyon, kalan limit.
  Varsa: sonuç backend'in hesabıyla **birebir aynı mı**? İki kaynak bir doğru = kaçınılmaz tutarsızlık.
  Ekranda gösterilen toplam ile backend'in kaydettiği toplam ayrışırsa müşteri şikayeti doğar.
- **Tutar nasıl taşınıyor?** `number` ise float riski var. Doğrusu: string, ya da tam sayı kuruş
  (minor unit). API'den `number` olarak geliyorsa dönüşüm noktası nerede?
- `toFixed` yuvarlama için kullanılıyor mu? Güvenilmez. `Intl.NumberFormat` veya kuruş tam sayısı.
- **Kullanıcı girdisi parse:** `parseFloat("1.234,56")` → `1.234`. Türkçe format girdi maskesi
  ile parse simetrik mi? Maske `1.234,56` gösteriyorsa parse `,` ve `.` rollerini doğru anlıyor mu?
- **Format:** `Intl.NumberFormat('tr-TR', {style:'currency', currency:'TRY'})` mi, elle string
  birleştirme mi? Elle formatta binlik ayracı, ondalık ayracı, sembol yeri hatalı olur.
- Yuvarlama yönü tutarlı mı? Gösterimde aşağı, backend'de yukarı → "1 kuruş" şikayeti.
- `Number.MAX_SAFE_INTEGER` (9.007e15): kuruş cinsinden çok büyük tutarlarda taşma
- Para birimi tutarla birlikte taşınıyor mu, yoksa TRY varsayılıyor mu?
- Yüzde/oran hesabı: `tutar * 0.18` float hatası biriktiriyor mu?

**Yanlış pozitif tuzakları:**
- Sadece gösterim amaçlı, backend'e gitmeyen ve karşılaştırılmayan hesap → P3
- `dinero.js`, `big.js`, `decimal.js` gibi bir kütüphane kullanılıyorsa float bulgusu geçersiz —
  **kütüphaneyi importta gördüysen**
- Adet, sıra numarası gibi para olmayan sayılar bu lensin konusu değil

---

### L3 — İşlem bütünlüğü ve idempotency

**Ne arar:** Yarım kalan işlem, tekrarlanan işlem, geri alınmayan iyimser güncelleme.

**Kontroller:**
- **Çift submit:** Butona iki kez basılırsa iki istek gidiyor mu? Buton `disabled` oluyor mu,
  istek uçarken? Ödeme akışında bu = çift transfer.
- **Idempotency anahtarı:** Aynı isteğin iki kez ulaşması mümkünse (retry, kullanıcı, ağ)
  istekte bir anahtar taşınıyor mu?
- **Optimistic UI:** Ekran hemen güncelleniyor ama istek başarısız olursa geri alınıyor mu?
  Kullanıcı başarılı sanıp ekrandan çıkarsa ne olur?
- **Çok adımlı akış:** Onay → OTP → sonuç. Ortada uygulama kapanırsa/arka plana atılırsa
  (bkz. L14) işlem hangi durumda kalıyor? Kullanıcı geri dönünce ne görüyor?
- **Kısmi başarı:** İki istek arka arkaya atılıyorsa (önce kaydet, sonra bildir) ikincisi
  patlarsa birinci geri alınıyor mu, kullanıcıya ne söyleniyor?
- **Form durumu:** Sayfa yenilenirse / WebView tazelenirse girilen veri kayboluyor mu?

**Yanlış pozitif tuzakları:**
- Idempotency backend'de anahtar olmadan da çözülmüş olabilir (doğal tekillik) — backend'i
  bilmiyorsan bulguyu güven 6 ile yaz, köprüye gitsin
- Salt okuma akışında çift istek P3'tür, P1 değil

---

### L4 — Async yarış ve durum tutarlılığı

**Ne arar:** Aynı anda uçan işlerin birbirini ezmesi.

**Kontroller:**
- **Son cevap kazanır:** Kullanıcı hızlıca A sonra B seçerse, A'nın cevabı sonra dönüp B'nin
  verisini eziyor mu? İstek sıra/iptal kontrolü var mı (`AbortController`, istek kimliği)?
- **Eski istek iptali:** Arama kutusu, filtre değişimi — önceki istek iptal ediliyor mu?
- **Fonksiyonel state güncellemesi:** `setX(x + 1)` yerine `setX(p => p + 1)` kullanılmış mı?
  Ardışık hızlı güncellemelerde ilki kayboluyor mu?
- **Paylaşılan store yarışı:** İki MFE veya iki ekran aynı store alanına yazıyor mu?
- **Unmount sonrası güncelleme:** İstek dönmeden ekran kapandıysa `setState` çağrılıyor mu?
- **Kilit yokluğu:** Aynı işlem iki farklı yerden tetiklenebiliyor mu (buton + klavye + deep link)?

**Yanlış pozitif tuzakları:**
- React Query / SWR gibi bir kütüphane istek iptalini ve tazeliği kendisi yönetiyorsa —
  **konfigürasyonunu okuyup gördüysen**
- Tek seferlik, tetiklenmesi imkânsız ikinci çağrı

---

### L5 — Hata yönetimi ve gözlemlenebilirlik

**Ne arar:** Sessizce yutulan hata, beyaz ekran, izlenemeyen arıza.

**Kontroller:**
- **Boş/geniş catch:** `catch {}`, `catch (e) { console.log(e) }`. Hata kayboldu.
- **Yutup varsayılan dönme:** `catch` içinde `return null`/`[]`/`{}`. Çağıran "veri yok" sanır.
  Finansal uygulamada "hesabınız yok" ile "hesaplarınız yüklenemedi" farkı kritiktir.
- **Error boundary:** React ağacında hata fırlarsa ne oluyor? Boundary yoksa **beyaz ekran** —
  WebView'da bu, kullanıcının uygulamadan çıkması demektir. P1.
- **Kullanıcıya giden mesaj:** Teknik detay mı iş mesajı mı? Kullanıcı ne yapacağını biliyor mu?
  Tekrar deneme yolu var mı yoksa tıkanıp kalıyor mu?
- **Hata ayrımı:** Ağ hatası, sunucu hatası, iş kuralı reddi ayrı ayrı mı ele alınıyor?
- **`console.log`/`console.error` prod'a çıkıyor mu?** WebView'da uzaktan debug ile
  (Safari Web Inspector / `chrome://inspect`) okunabilir. İçinde PII varsa L6'ya da düşer.
- **İzleme:** Hata bir yere raporlanıyor mu (Sentry vb)? Korelasyon kimliği var mı — destek
  ekibi müşteri şikayetini logda bulabiliyor mu?
- **Köprü hatası:** Native çağrısı fırlatırsa yakalanıyor mu (bkz. L14)?

**Yanlış pozitif tuzakları:**
- Üst seviyede global error boundary + global fetch interceptor varsa yerel eksiklik bulgu
  değildir — **ikisini de okuyup gördüysen**
- Bilinçli yutulan beklenen hata (yanında açıklayıcı yorum varsa)

---

### L6 — Güvenlik ve gizlilik

**Ne arar:** Yetkisiz erişim, veri sızıntısı, WebView'a özgü saklama riskleri.

**Kontroller:**
- **Token nerede duruyor?** `localStorage`/`sessionStorage` XSS ile okunabilir. WebView'da
  saklanan token, cihaz ele geçirilirse çıkarılabilir. Her MFE ayrı WebView olduğu için
  token'ı web tarafında saklamak zaten **çalışmaz** (L15): doğru yer native, her açılışta
  köprüyle alınır.
- **Token URL'de mi taşınıyor?** Native'den web'e devirde query parametresi kullanılıyorsa
  token; WebView geçmişine, loglara, `Referer` başlığına sızar. P1.
- **PII log/konsol:** TCKN, kart no, IBAN, telefon, bakiye `console.*` veya izleme aracına
  gidiyor mu? Hata nesnesi tümüyle raporlanıyorsa içinde ne var?
- **PII URL'de:** Route parametresi olarak hesap/müşteri numarası → geçmiş, analytics, log.
- **`dangerouslySetInnerHTML`:** Kaynağı dışarıdan mı geliyor? Sanitize var mı?
- **Yetki gösterim katmanında mı?** Butonu gizlemek yetki değildir; istek doğrudan atılabilir.
- **Deep link parametresi doğrulanıyor mu?** Dışarıdan gelen veri (tutar, alıcı) ekrana
  ön-doldurulup kullanıcı onaylamadan işleme giriyor mu?
- **Hassas ekran:** Ekran görüntüsü/kayıt engeli gerekiyorsa native'e sinyal veriliyor mu?
- **Kopyala/yapıştır ve otomatik doldurma:** Hassas alanlarda kapalı mı?

**Yanlış pozitif tuzakları:**
- Token native tarafta tutulup her istekte köprüyle alınıyorsa saklama bulgusu geçersiz —
  **köprü kodunu okuyup gördüysen**
- Test ortamı sabitleri, mock veriler

---

### L7 — Sözleşme ve geriye uyum

**Ne arar:** Sözleşme kayması. Bu mimarinin **baskın risk** lensi.

Üç sözleşme var ve üçü farklı hızda değişiyor:

| Sözleşme | Değişim hızı | Risk |
|---|---|---|
| Web ↔ Native köprü | web hızlı, native **app store'dan yavaş** | Eski native, yeni web'i çalıştırır |
| Web ↔ Backend API | ikisi de orta | Alan/tip değişimi sessiz kırar |
| MFE ↔ MFE / kabuk | bağımsız deploy | Ortak durum ve olay sözleşmesi kayar |

**Kontroller:**
- **Yeni köprü metodu çağrılıyor mu?** Eski native sürümde o metot olmayabilir. Native'i
  düzeltemeyiz; **varlık kontrolü bizim tarafta.** Kontrol yoksa bulgu bizim kodumuzdadır.
- **Sürüm/yetenek bilgisi:** Web, konuştuğu native'in neyi desteklediğini biliyor mu?
  Bilmiyorsa geri düşüş (fallback) davranışı tanımlı mı?
- **Köprü mesaj formatı değişti mi?** Alan eklediysek eski native'in bunu anlamayacağını
  varsayıp geri uyumlu mu gönderiyoruz?
- **API yanıt sözleşmesi:** Alan kaldırıldı mı, tipi değişti mi, `null` gelebilir hale geldi mi?
- **TypeScript tipi runtime garantisi değildir.** `as ApiResponse` ile cast ediliyorsa tip bir
  **yalandır** — gerçek yanıt farklıysa derleyici uyarmaz, uygulama çalışma anında patlar.
  Runtime doğrulama (Zod/io-ts) var mı? Yoksa bu tek başına bulgudur.
- **Deploy sırası:** Web mi önce çıkmalı backend mi? Aradaki pencerede uygulama çalışıyor mu?
- **Geriye dönük veri:** Eski oturumdan kalmış `localStorage` verisi yeni kodla okunuyor mu?
  Şema değiştiyse migrasyon veya sürüm damgası var mı?
- **MFE sürüm damgası:** Kabuk hangi MFE sürümünü yüklediğini biliyor mu, uyumsuzlukta ne yapıyor?

**Yanlış pozitif tuzakları:**
- Köprü sözleşmesi sürümlü ve web tarafında sürüm kontrolü varsa — **kontrolü okuyup gördüysen**
- Yalnız iç kullanım, tek çağrılı, dışa açık olmayan yardımcı

---

### L8 — Performans

**Ne arar:** Düşük donanımlı cihazda ve zayıf şebekede yavaşlık.

> Hedef cihaz masaüstü değil. Düşük segment Android + 3G varsayımıyla bak.

**Kontroller:**
- **Bundle boyutu:** Yeni ağır bağımlılık eklendi mi? Kod bölme (code splitting) var mı?
  MFE bundle'ı ilk açılışta mı yükleniyor, lazy mi?
- **Gereksiz render:** Inline obje/dizi/fonksiyon prop olarak geçiliyor mu (her render yeni
  referans)? `Context` değeri her render yeni obje mi (tüm tüketiciler render olur)?
- **Uzun liste:** Sanallaştırma (virtualization) var mı? 500 hesap hareketi tek seferde
  render ediliyor mu?
- **Ana iş parçacığı bloğu:** Render sırasında ağır hesap, büyük dizi `sort`/`filter`,
  senkron JSON parse. WebView'da bu doğrudan takılma (jank) demek.
- **Görsel boyutu:** Tam çözünürlük görsel küçük alanda mı gösteriliyor?
- **Ardışık istek zinciri:** Birbirini bekleyen çağrılar paralel olabilir mi?
- **Bellek:** Büyük veri state'te tutuluyor mu, ekrandan çıkınca bırakılıyor mu (L9 kesişimi)?
- **Soğuk başlangıç:** Bu MFE ayrı bir WebView'da açılıyor — her girişte bundle indirme,
  parse ve ilk veri çekimi baştan yapılır. İlk anlamlı ekran ne kadar sonra geliyor?
  Ortak kütüphaneler MFE'ler arasında cache paylaşıyor mu (aynı origin mi)?

**Yanlış pozitif tuzakları:**
- Küçük ve sabit boyutlu listeler
- Uygulama açılışında bir kez çalışan kod
- `React.memo` yokluğu tek başına bulgu değildir — ölçülebilir bir maliyet göstermelisin

---

### L9 — Yaşam döngüsü ve sızıntı

**Ne arar:** Temizlenmeyen kaynak, ekran kapandıktan sonra yaşayan kod.

**Kontroller:**
- **`useEffect` cleanup:** Abone olunan her şey bırakılıyor mu? `addEventListener` →
  `removeEventListener`, `setInterval`/`setTimeout` → `clear*`, WebSocket → `close`.
- **`AbortController`:** Uçan `fetch` unmount'ta iptal ediliyor mu?
- **Unmount sonrası `setState`:** Ekran kapandı, istek döndü, state güncelleniyor mu?
- **Köprü dinleyicisi:** Native'den gelen mesaj için kurulan global dinleyici
  (`window.addEventListener('message')`) kaldırılıyor mu? Kaldırılmazsa **her ekran açılışında
  bir tane daha eklenir** ve tek mesaj N kez işlenir — para akışında N kez işlem denemesi.
- **Global'e yazılan referans:** `window.X = ...` temizleniyor mu (MFE unmount'unda)?
- **Sınırsız büyüyen state:** Sonsuz kaydırma listesi hiç kısaltılmıyor mu?
- **Zamanlayıcı:** Ekrandan çıkınca duran bir sayaç (OTP geri sayımı) gerçekten duruyor mu?

**Yanlış pozitif tuzakları:**
- Uygulama ömrü boyunca yaşaması gereken tek sefer kurulan dinleyici (bootstrap'ta)
- Framework'ün kendi yönettiği abonelikler (React Query cache)

---

### L10 — Ortam, locale ve cihaz farkı

**Ne arar:** Geliştirme makinesinde doğru, kullanıcının telefonunda yanlış çalışan kod.

**Kontroller:**
- **Türkçe locale tuzağı:** `toUpperCase()`/`toLowerCase()` locale'siz çağrıldığında Türkçe
  ortamda `i` → `İ`, `I` → `ı` olur. Kod karşılaştırması, para birimi kodu, il/ilçe eşleşmesi
  sessizce bozulur. Doğrusu `toUpperCase('en-US')` veya `toLocaleUpperCase('tr-TR')` —
  hangisi isteniyorsa bilinçli seçilmiş mi?
- **Sayı ve tarih formatı:** `toLocaleString()` locale'siz çağrılıyorsa cihaz diline göre
  değişir. `1.234,56` mı `1,234.56` mı? Ekranda ve parse'ta aynı varsayım mı?
- **Tarih:** `new Date("2026-03-15")` UTC olarak, `new Date("2026/03/15")` yerel olarak
  yorumlanır. Gün sonu/gün başı hesabı hangi dilimde? Yaz saati geçişi?
- **iOS ↔ Android farkı:** Tarih parse, `Intl` desteği, CSS davranışı, `100vh` klavye açıkken.
- **Android WebView sürüm parçalanması:** Eski cihazlarda eski Chromium. Kullanılan JS/CSS
  özelliği (opsiyonel zincirleme, `structuredClone`, `:has()`, container query) destekleniyor mu?
  Transpile hedefi (`browserslist`/`target`) gerçekten hedef cihazları kapsıyor mu?
- **Hardcoded değer:** URL, limit, sürüm, ortam adı koda gömülü mü?
- **Ortam ayrımı:** Test/prod ayrımı build zamanında mı, runtime'da mı? Yanlış ortama
  bağlanma riski var mı?
- **Sistem yazı tipi büyütmesi:** Kullanıcı yazıyı büyütünce düzen taşıyor mu (L16 kesişimi)?

**Yanlış pozitif tuzakları:**
- Yalnız rakam içeren string üzerinde `toUpperCase` → P3
- Gerçekten sabit olan protokol/matematik sabitleri
- Polyfill yüklendiği gösterilebiliyorsa tarayıcı desteği bulgusu geçersiz

---

### L11 — Ağ çağrısı davranışı

**Ne arar:** Şebeke kötüyken veya sunucu cevap vermezken ne olduğunu.

> Mobilde kopuk şebeke istisna değil, **normal durumdur.**

**Kontroller:**
- **Timeout:** `fetch` varsayılan olarak süresizdir. Zaman aşımı tanımlı mı? Yoksa kullanıcı
  sonsuz spinner'da kalır ve uygulamayı kapatır.
- **Offline:** Bağlantı yokken ne oluyor? Anlaşılır mesaj + tekrar deneme var mı?
- **Retry güvenliği:** Otomatik tekrar deneme varsa istek idempotent mi (L3)? Değilse
  retry = çift işlem.
- **Retry stratejisi:** Anında ve sınırsız mı, artan bekleme var mı?
- **Yavaş şebeke:** İlk yükleme sırasında kullanıcı ne görüyor — boş ekran mı, iskelet mi?
- **Kısmi/bozuk yanıt:** Beklenen alan yoksa kod `undefined` ile devam ediyor mu (L7 kesişimi)?
- **HTTP durum ayrımı:** `4xx` iş hatası, `5xx` sistem hatası, ağ hatası ayrı ele alınıyor mu?
  `fetch` `4xx`/`5xx`'te **reject etmez** — `res.ok` kontrolü var mı?
- **Eşzamanlı istek sayısı:** Ekran açılışında kaç istek atılıyor?

**Yanlış pozitif tuzakları:**
- Merkezî HTTP istemcisi timeout/retry/hata eşlemesini yönetiyorsa — **istemciyi okuyup gördüysen**
- Arka planda sessizce çalışan, kullanıcıyı bekletmeyen istek

---

### L12 — Bakım riski

**Ne arar:** Bugün doğru çalışan ama **bir sonraki değişiklikte bug üretecek** yapılar.
Kalite lensi değil, gecikmeli bug lensi.

**Kontroller:**
- **Kopyala-yapıştır ikizler:** Aynı iş kuralı iki MFE'de veya iki bileşende. Biri düzeltilir,
  diğeri unutulur. MFE mimarisinde bu riski yüksek — kod paylaşımı zor olduğu için kopyalanır.
- **Ölü kod:** Çağrılmayan bileşen, ulaşılamayan dal, kullanılmayan prop, ölü feature flag.
- **Aşırı karmaşıklık:** 300 satırlık bileşen, 6 seviye iç içe koşullu render, 10 `useState`
  yan yana. Doğrudan viva sinyali — burayı anlatamayacaksan basitleşmeli.
- **Sihirli sabit:** Açıklamasız `50000`, `"03"`, `0.18`, magic string route/event adı.
- **Yanıltıcı isim:** `validate()` aslında kaydediyor, `useX` hook değil.
- **Tip yalanı:** `any`, `as unknown as X`, `@ts-ignore`. Derleyici susturulmuş — nerede,
  neden? Susturulan yer çoğu zaman gerçek bir uyumsuzluğu saklar.
- **Sessiz varsayım:** Kontrolsüz `!` (non-null assertion).

**Yanlış pozitif tuzakları:**
- Bilinçli tekrar (yorumla belirtilmiş, bağımlılık koparmak için)
- Üretilmiş kod, test kodu
- Biçimsel şeyler → **asla raporlanmaz**

---

### L13 — React render ve durum doğruluğu

**Ne arar:** React'in kendi kurallarından doğan, sessiz ve tekrarlanabilirliği düşük hatalar.

**Kontroller:**
- **Eksik dependency:** `useEffect`/`useCallback`/`useMemo` bağımlılık dizisi eksikse
  **eski değer (stale closure)** kullanılır. Efekt bir kez doğru çalışır, sonra eski
  parametreyle çalışmaya devam eder. Örnek: eski hesap numarasıyla işlem.
- **Fazla dependency / kararsız referans:** Inline obje/dizi/fonksiyon bağımlılıkta →
  her render'da efekt yeniden koşar → sonsuz döngü veya tekrarlanan istek.
- **Efekt idempotent mi?** React 18 StrictMode geliştirmede efekti **iki kez** çalıştırır.
  Efekt içinde `POST` varsa iki kayıt oluşur. Prod'da tek koşar ama bu, efektin yanlış
  yerde olduğunun işaretidir.
- **`key` olarak dizi indeksi:** Liste sıralanır/filtrelenir/silinirse React yanlış öğeyi
  yeniden kullanır — **girilen veri yanlış satıra taşınır.** Hesap listesinde P1.
- **Prop'tan türetilmiş state:** `useState(props.x)` — prop değiştiğinde state güncellenmez,
  ekran eski değeri gösterir.
- **Fonksiyonel güncelleme:** `setX(x + 1)` ardışık çağrılarda kaybolur; `setX(p => p + 1)` olmalı.
- **Koşullu hook:** Hook'lar koşul/döngü içinde çağrılıyor mu (hook sırası bozulur)?
- **Controlled/uncontrolled geçişi:** `value={x}` başlangıçta `undefined` ise input
  uncontrolled başlar, sonra controlled olur — React uyarır, veri kaybolur.
- **Render sırasında yan etki:** Render gövdesinde `fetch`, `setState`, mutasyon.
- **Doğrudan mutasyon:** `state.list.push(...)` — referans değişmez, render tetiklenmez.
- **`useMemo`/`useCallback` doğruluk için kullanılıyor mu?** Bunlar performans aracıdır;
  React garanti vermez (cache atılabilir). Doğruluk buna dayanıyorsa bulgudur.

**Yanlış pozitif tuzakları:**
- ESLint `react-hooks/exhaustive-deps` kuralı açık ve uyarı yoksa dependency bulgusu zayıftır —
  **konfigürasyonu okuyup gördüysen**; `eslint-disable` yorumu varsa tam tersi, kuvvetli bulgudur
- Kararlı ve sabit olduğu ispatlanabilen referanslar (modül seviyesi sabitler)
- `key` olarak index, listenin **hiç değişmediği** ispatlanabiliyorsa kabul edilebilir

---

### L14 — Native köprü çağrısı

**Ne arar:** Köprü çağrılarında **bizim tarafımızdaki** savunma eksikliği.

> Native'i denetlemiyoruz. Native'in çalışmama ihtimaline karşı ne yaptığımızı denetliyoruz.

**Kontroller:**

- **Varlık kontrolü:** Köprü nesnesi/metodu çağrılmadan önce var mı diye bakılıyor mu?
  Bakılmıyorsa: normal tarayıcıda açıldığında, köprü adı değiştiğinde ve **eski native
  sürümlerde** çalışma anında patlar. Native'i düzeltemeyiz; varlık kontrolü bizim işimiz.
- **Platform ayrımı:** iOS ve Android köprü erişimi farklı. Kod ikisini de ele alıyor mu,
  yoksa biri varsayılıp diğerinde sessizce mi çalışmıyor? Tek platform varsayımı, diğer
  platformun tamamında özelliğin hiç çalışmaması demektir.
- **Cevapsız çağrı:** Mesaj gidiyor ama cevap gelmezse ne oluyor? Zaman aşımı var mı?
  Köprü sarmalayıcıları `Promise` döndürüp **hiç çözülmeyebilir** — spinner'da donan
  ekranın en sık sebebi budur ve çözümü bizim tarafta.
- **Cevap doğrulama:** Gelen veri `JSON.parse` ediliyorsa `try/catch` var mı? Şekli
  doğrulanıyor mu, yoksa `as` ile cast mı (L7)? Native'in doğru veri göndereceğine güvenmek
  bizim tarafta bir varsayımdır.
- **Hata yolu:** Köprü çağrısı fırlatırsa yakalanıyor mu? Yakalandıktan sonra **hangi yöne
  düşüyor** — işlem devam mı ediyor, duruyor mu? Güvenlik/limit/doğrulama sorgusunda
  cevapsızlıkta devam etmek (fail-open) P1'dir.
- **Dinleyici temizliği:** Native'den mesaj almak için kurulan global dinleyici
  (`window.addEventListener('message')`) kaldırılıyor mu? Kaldırılmazsa her ekran açılışında
  bir tane daha eklenir ve tek mesaj N kez işlenir (L9).
- **Gelen mesaj doğrulama:** `message` olayının içeriği ve kaynağı kontrol ediliyor mu?
- **MFE geçişi:** Başka bir MFE'yi açmak köprüden geçer. Taşınan parametre doğrulanıyor mu?
  Geçiş başarısız olursa kullanıcı hangi ekranda kalıyor?
- **Native izin reddi:** Kamera/konum reddedilirse akış tıkanıyor mu, anlaşılır mesaj var mı?

**Yanlış pozitif tuzakları:**
- Merkezî bir köprü sarmalayıcı varlık kontrolü, zaman aşımı, platform ayrımı ve doğrulamayı
  yönetiyorsa yerel eksiklik bulgu değildir — **sarmalayıcıyı okuyup gördüysen**
- Yalnız geliştirme ortamında kullanılan hata ayıklama köprüsü
- Native'in davranışı hakkında bulgu yazma; yalnız bizim savunmamızın eksikliği bulgudur

---

### L15 — Oturum ve durum dayanıklılığı

**Ne arar:** Kodumuzun, **sıfırdan yüklenmeye ve izole bir bağlamda başlamaya** dayanıklı
olup olmadığı.

> Her MFE ayrı WebView'da başlar; sayfa her an sıfırdan yüklenebilir. Bunu denetlemiyoruz,
> bunu **varsayıyoruz.** Denetlediğimiz şey: buna hazır mıyız?

**Kontroller:**

- **Oturum nereden alınıyor?** Token `localStorage`/`sessionStorage`'dan okunuyorsa: bu MFE
  kendi bağlamında başlar ve **kodda hiçbir yer o anahtarı yazmıyorsa** token orada olmaz.
  Kanıt aranabilir: depoya yazan bir satır var mı? Yoksa bu kesin bir bulgudur — doğru yol
  köprüden almaktır.
- **Token yenileme:** Süre dolarsa web tarafı yenileyebiliyor mu, yoksa kullanıcı akışın
  ortasında tıkanıyor mu?
- **Sıfırdan yükleme dayanıklılığı:** Çok adımlı bir akışın 2. adımındayken sayfa yeniden
  yüklenirse ne oluyor? Adım, form verisi, seçimler yalnız bellekte mi? Kurtarma
  (kalıcı taslak, URL'de adım, native'e emanet) var mı?
  Üç adımlık transferin ortasında baştan başlamak, işlemi terk ettirir.
- **Başlangıç parametresi:** WebView'a verilen başlangıç parametresi (ekran, hesap, dil)
  eksik veya bozuk gelirse ne oluyor? Doğrulanıyor mu, varsayılan var mı, patlıyor mu?
- **İlk yükleme hata yolu:** Açılışta gereken veri (oturum, profil, config) alınamazsa
  kullanıcı ne görüyor? Beyaz ekran veya sonsuz spinner **P1**. Anlaşılır hata + tekrar
  deneme olmalı.
- **Ortak tercih:** Dil, tema, biçim tercihi nereden okunuyor? Her MFE kendi kopyasını
  tutuyorsa MFE'ler arasında tutarsızlaşır — kaynak tek mi?
- **Bağlam varsayımı:** Kod, başka bir MFE'nin veya önceki bir ekranın bellekte bir şey
  bıraktığını varsayıyor mu? Bu bağlamda öyle bir şey yok.

**Yanlış pozitif tuzakları:**
- Durum gerçekten kalıcı bir kaynaktan (API) her açılışta çekiliyorsa dayanıklılık sorunu yok
- Tek ekranlık, durum taşımayan, yeniden başlaması ucuz akışlar
- Native'in depolamayı nasıl paylaştığı hakkında bulgu yazma; **bizim kodumuz neyi
  varsayıyor**, bulgu odur

---

### L16 — Mobil UX ve erişilebilirlik

**Ne arar:** Telefonda, gerçek koşullarda kullanılamama halleri.
Finansal uygulamalarda erişilebilirlik ayrıca mevzuat konusudur.

**Kontroller:**
- **Klavye:** Açıldığında girdi alanı veya onay butonu gizleniyor mu? `100vh` klavye açıkken
  yanlış hesaplanır. Kaydırma ile ulaşılabiliyor mu?
- **Güvenli alan:** Çentik, alt gezinme çubuğu, durum çubuğu içerik kesiyor mu?
- **Dokunma hedefi:** Buton/ikon en az ~44×44 pt mi? Yan yana küçük hedefler var mı?
- **Çift dokunma:** Hızlı iki dokunuş iki işlem tetikliyor mu (L3)?
- **Geri tuşu / kaydırarak geri:** Çok adımlı akışta veri kaybettiriyor mu? Native'in geri
  davranışını değiştiremeyiz ama web tarafında uyarı/koruma koyabiliriz — var mı?
- **Offline / yavaş şebeke UX'i:** Boş ekran mı, iskelet mi, anlaşılır mesaj mı?
  Tekrar deneme butonu var mı?
- **Yükleme durumu:** Uzun süren işlemde geri bildirim var mı? Butona basıldığı belli oluyor mu?
- **Ekran okuyucu:** Yalnız ikonlu butonların erişilebilir adı var mı? Hata mesajı okunuyor mu?
- **Yalnız renkle bilgi:** Hata/başarı sadece renkle mi anlatılıyor?
- **Yazı tipi ölçekleme:** Sistem yazısı büyütülünce düzen taşıyor, metin kesiliyor mu?
- **Kontrast:** Metin/arka plan kontrastı yeterli mi (küçük metinlerde özellikle)?
- **Girdi tipi:** Sayısal alanlarda sayısal klavye açılıyor mu (`inputMode`)?
  IBAN/kart alanında otomatik büyük harf/düzeltme kapalı mı?

**Yanlış pozitif tuzakları:**
- Tasarım sisteminden gelen bileşenler bu kuralları merkezî olarak sağlıyorsa —
  **bileşeni okuyup gördüysen**
- Yalnız geliştiriciye görünen ekranlar

---

## 5. Çıktı biçimi

`dv-celiskici` her lens çağrısında **tam olarak** bu biçimi döner. Sağlık işaretleri zorunlu.

```
LENS: L13
MOD: A
DOSYA_TIPI: UI, DURUM
OKUNAN_DOSYA: 6
ATLANAN_DOSYA: 0
BULGU_SAYISI: 2

--- BULGU ---
ID: L13-01
DOSYA: src/screens/TransferOnay.tsx:48
SEVERITY: P1
GUVEN: 9
ALINTI:
    useEffect(() => {
      gonder(hesapNo, tutar);
    }, []);
SENARYO:
    Bağımlılık dizisi boş. Kullanıcı hesap değiştirip tekrar onaylarsa efekt
    ilk render'daki hesapNo ile çalışır — transfer yanlış hesaptan gider.
ETKI:
    Yanlış hesaptan para çıkışı
--- SON ---

--- BULGU ---
ID: L13-02
DOSYA: src/components/HesapListesi.tsx:31
SEVERITY: P2
GUVEN: 7
ALINTI:
    {hesaplar.map((h, i) => <HesapSatiri key={i} hesap={h} />)}
SENARYO:
    key olarak dizi indeksi kullanılıyor. Liste filtrelenince React satırları
    yeniden kullanır; bir satırda girilen tutar başka hesabın satırında görünür.
ETKI:
    Kullanıcı yanlış hesaba işlem yaptığını fark etmeyebilir
--- SON ---
```

Bulgu yoksa da sağlık işaretleri yazılır:

```
LENS: L15
MOD: A
DOSYA_TIPI: KABUK
OKUNAN_DOSYA: 3
ATLANAN_DOSYA: 0
BULGU_SAYISI: 0
```

`OKUNAN_DOSYA: 0` + `BULGU_SAYISI: 0` **temiz değil, başarısızlıktır.** Hiçbir dosya
okunamadıysa `HATA:` ile bitir.

---

## 6. Bakım

Bu paket yaşayan dokümandır. UAT veya prod'a kaçan her defect için sorulur:
**hangi lens kaçırdı?** Cevap ya mevcut bir lense yeni kontrol maddesi, ya yeni bir lens olur.
Her ekleme bir altın vaka ile birlikte gelir — yoksa eklemenin işe yaradığı doğrulanmaz.

Kayıt: `dogrulama/kacan-defectler.md` · Sürüm: `VERSION`.
Lens paketi değiştiğinde altın vakaların tamamı yeniden koşulur.
