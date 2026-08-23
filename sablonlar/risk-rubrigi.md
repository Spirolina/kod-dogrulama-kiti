# Risk Rubriği (G0)

Amaç: her değişikliğe aynı derinlikte doğrulama uygulanmaz. Tek tip ağır süreç üçüncü
haftada terk edilir.

Lens tanımları burada tekrar edilmez — kanonik kaynak `lens-paketi.md`, burada sadece
lens ID'leri (`L1`…`L16`) kullanılır.

---

## 1. Kademe kararı

```
                    ┌──────────────────────────────┐
                    │ T1 tetikleyicilerinden        │
                    │ HERHANGİ biri tuttu mu?       │
                    └──────────────┬───────────────┘
                        evet ┌─────┴─────┐ hayır
                             ▼           ▼
                           ┌────┐   ┌───────────────────────┐
                           │ T1 │   │ Kullanıcıya görünen    │
                           └────┘   │ davranış değişiyor mu? │
                                    └──────┬────────────────┘
                              evet ┌───────┴──────┐ hayır
                                   ▼              ▼
                                ┌────┐         ┌────┐
                                │ T2 │         │ T3 │
                                └────┘         └────┘
```

## 2. T1 tetikleyicileri

Herhangi biri tutuyorsa **T1**. Tek tetikleyici yeter.

| # | Tetikleyici | Boş geçilemeyecek lensler |
|---|---|---|
| TR-1 | Tutar gösterimi veya frontend'de tutar hesabı (toplam, taksit, komisyon, kalan limit) | L2, L1 |
| TR-2 | Oturum, token, kimlik doğrulama, yetkiye göre ekran/aksiyon | L6, L14, L7 |
| TR-3 | Müşteri PII ekranda, log'da, URL'de veya izleme aracında | L6, L5 |
| TR-4 | **Native köprü çağrısı ekleniyor/değişiyor** (yeni metot, mesaj formatı, yeni izin) | L14, L7 |
| TR-5 | Oturum alma/yenileme, uygulama başlangıcı, çok adımlı akışın durum yönetimi, MFE geçişi | L15, L14, L7 |
| TR-6 | Para hareketi başlatan akış (transfer, ödeme, OTP onayı, kart işlemi) | L3, L4, L13, L11 |
| TR-7 | Hata/offline/retry davranışı değişiyor | L11, L5, L16 |

Bu mimarinin iki özel tetikleyicisi. İkisi de **bizim kodumuzdaki savunmayla** ilgili —
native tarafı denetlemiyoruz.

**TR-4** — köprü çağrısı native'e bağımlıdır ve native'i düzeltemeyiz. Yapabileceğimiz tek
şey varlık kontrolü, zaman aşımı ve hata yolu koymak. Köprüye dokunan her değişiklik T1'dir.

**TR-5** — her MFE kendi bağlamında sıfırdan başlar. Oturumu nereden aldığımız ve sıfırdan
yüklenmeye dayanıklı olup olmadığımız bizim sorumluluğumuz. Kırılırsa müşteri akışın
ortasında login ekranına düşer veya baştan başlar.

## 3. T2 ve T3

**T2 — kullanıcıya görünen davranış değişiyor, T1 tetikleyicisi yok.**
`lens-paketi.md` §3 matrisindeki, dosya tipine karşılık gelen **`●` lensler** koşar.
Dosya ön-filtresi açık.

**T3 — davranış değişmiyor.** Metin/çeviri düzeltmesi, yorum, biçimlendirme, ölü kod silme,
görsel varlık değişimi. Lens koşmaz. RTM + kısa analist testi + sonuç dosyası.

Dikkat: **metin değişikliği her zaman T3 değildir.** Bir hata mesajının metni müşteriye ne
yapacağını söylüyorsa (R- gereksinimine bağlıysa) davranıştır → T2.

## 4. Lens seçimi — iki eksen

Kademe *ne kadar derin* bakılacağını, dosya tipi *hangi lenslerin anlamlı* olduğunu belirler.
Matris `lens-paketi.md` §3'te.

| Kademe | Matristen ne alınır | Dosya filtresi |
|---|---|---|
| T1 | `●` + `○` lenslerin tamamı | kapalı |
| T2 | yalnız `●` lensler | açık |
| T3 | — | — |

Bir UI bileşenine köprü lensi koşmak anlamsızdır; bir API istemcisine render lensi koşmak
anlamsızdır. İkinci eksen lens sayısını artırırken süreyi artırmaz.

Değişiklik **üçten fazla dosya tipine** dokunuyorsa (örn. hem UI hem köprü hem kabuk)
bu bir kapsam sinyalidir → **T1'e yükselt veya değişikliği böl.**

## 5. Kademe → kapı matrisi

| Kapı | T1 | T2 | T3 |
|---|---|---|---|
| G1 RTM | ✅ | ✅ | ✅ |
| G1b Analist test paketi | ✅ | ✅ | kısa |
| G2 Adversarial | ✅ matris `●`+`○`, filtresiz | ✅ matris `●`, filtreli | — |
| G2 Çürütme | ✅ P1/P2 tekil, P3 toplu | ✅ toplu | — |
| G4 Kavrayış sınavı | ✅ tam (7 soru) | ✅ kısa (4 soru) | — |
| G6 Sonuç dosyası | ✅ tüm çıktılar commit | ✅ sonuç dosyası + RTM commit | ✅ sonuç dosyası |
| Duvar saati | ≤ 16 dk | ≤ 5 dk | ≤ 2 dk |

## 6. Karar kuralları

**Şüphede yukarı yuvarla.** T1 mi T2 mi belli değilse T1.

**Yükseltme serbest, düşürme onaylı.** Kademeyi yükseltmek onay istemez; düşürmek
developer'ın açık onayını ister ve gerekçesi `SONUC.md`'ye yazılır. Yanlış düşürme sessizce koruma
kaldırır, yanlış yükseltme sadece zaman kaybettirir. Asimetrik risk, asimetrik kural.

**Karışık değişiklik en yükseğe uyar.** Ortalama alınmaz.

**Kademe ve tetikleyici `SONUC.md`'ye yazılır.** Denetimde ilk sorulan budur.

## 7. Örnekler

| Değişiklik | Kademe | Neden |
|---|---|---|
| Transfer onay ekranında tutar formatını değiştirmek | **T1** | TR-1 — tutar gösterimi |
| Taksit önizlemesini frontend'de hesaplamak | **T1** | TR-1 — frontend'de tutar hesabı, backend ile ayrışma riski |
| Native'den gelen token'ı yeni bir yöntemle almak | **T1** | TR-4 — köprü sözleşmesi, eski native sürüm riski |
| Yeni bir MFE geçişi eklemek | **T1** | TR-5 — yeni bağlam, oturum ve parametre devri |
| Hesap listesine sonsuz kaydırma eklemek | **T2** | Davranış değişiyor, tetikleyici yok. Dosya tipi UI+DURUM+API |
| Hata mesajı metnini "tekrar deneyin" olarak değiştirmek | **T2** | Kullanıcıya ne yapacağını söylüyor, davranıştır |
| Buton rengini değiştirmek | **T3** | Davranış değişmiyor |
| Log satırına müşteri numarası eklemek | **T1** | TR-3 — PII, WebView'da uzaktan debug ile okunabilir |
| Oturumu okuma yöntemini değiştirmek (depolama ↔ köprü) | **T1** | TR-5 + TR-2 — her MFE ayrı bağlam, yanlış kaynak müşteriyi login'e düşürür |
| Offline durumunda gösterilen ekranı eklemek | **T1** | TR-7 — hata/offline davranışı |
