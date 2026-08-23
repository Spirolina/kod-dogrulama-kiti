---
name: dv-kavra
description: Kavrayış sınavı. Değişikliği okuma sırasıyla gezdirir, sonra developer'ı koda bakmadan sınar ve boşlukları gösterir. /dv-dogrula sonrası koşulur.
---

# /dv-kavra — Kavrayış Kapısı (G4)

Bu, doğrulama zincirinin **insan** adımı. Önceki kapılar kodun doğru olup olmadığını sorar;
bu kapı **senin** kodu savunup savunamayacağını sorar.

Kural: sorular **koda bakmadan** cevaplanır. Sınav senin için, kimseye rapor verilmiyor.
Kopya çekmek sadece kendini kandırmak.

## Adım 0 — Girdi

Argüman: doğrulama klasörü (`dogrulama/<tarih>-<konu>/`). Verilmediyse en son değiştirilen
klasörü bul ve kullanıcıya onaylat.

Klasörden oku: `ic/rtm.md` (varsa), kademe bilgisi, mod (A/B), kapsam.
`/dv-dogrula` hiç koşmadıysa uyar ama devam et — `/dv-kavra` tek başına da çalışır.

## Adım 1 — Hazırlık

`dv-kavrayis-kocu` agent'ını `GOREV: HAZIRLIK` ile çağır.
Üretilenler: `ic/tur.md` ve `ic/sinav-anahtari.md`.

Sağlık işaretlerini kontrol et. `OKUNAN_DOSYA: 0` veya `KANITSIZ_ANAHTAR_NOKTA > 0` ise
dur ve bildir — sınav geçersiz olur.

## Adım 2 — Rehberli tur

`ic/tur.md` içeriğini kullanıcıya göster. Sonra söyle:

> Kodu bu sırayla oku. Bittiğinde "hazırım" yaz. Sınav sırasında koda bakmayacaksın.

**Kullanıcı "hazırım" demeden Adım 3'e geçme.**

## Adım 3 — Sınav

`ic/sinav-anahtari.md` dosyasını oku (kullanıcıya **gösterme**).

Soruları **tek tek** sor. Her soruda:

1. Yalnız soruyu yaz. İpucu verme, cevabı ima etme, seçenek sunma.
2. Cevabı bekle.
3. Anahtarla karşılaştır, **hemen** geri bildirim ver:
   - Eksik kalan anahtar noktası varsa söyle ve `path:line` kanıtını göster
   - Cevap doğruysa tek satır onay yeter, övgü yok
   - Cevap **yanlış ama emin** ise bunu ayrıca belirt: emin olunan yanlış, bilinmeyenden tehlikeli
4. Puanı içeride tut, ara skor duyurma — sonraki cevapları etkiler.

"Bilmiyorum" geçerli bir cevaptır, 0 puandır, geçiştirilmez. Bir sonraki soruya geç.

## Adım 4 — Sonuç

Puanları topla. Eşik: **T1 ≥ 10/14 · T2 ≥ 6/8**.

`ic/sinav-sonucu.md` yaz: skor, soru bazlı tablo, zayıf alanlar, aksiyon.

**Eşik altıysa** — suçu kullanıcıya atma. İki başlıktan biriyle çık:

- Kod fazla karmaşık → hangi dosya/fonksiyon bölünmeli
- Değişiklik fazla büyük → nereden ikiye ayrılmalı

Sonra sor: kodu sadeleştirip sınavı tekrarlamak mı, yoksa eksikleri dokümana yazıp devam
etmek mi. Kararı kullanıcı verir.

**Eşik üstüyse ama tek soru 0 aldıysa:** o konu bir doküman satırı olarak kayda geçer.

## Adım 5 — `SONUC.md`'ye işle

`SONUC.md` içindeki `## Kavrayış sınavı (viva)` bölümünü doldur: skor, eşik, zayıf alanlar,
aksiyon.

Sonra kullanıcıya hatırlat:

> `SONUC.md` içindeki *"Viva sorularını koda bakmadan cevapladım"* kutusunu sen işaretleyeceksin.
> Bu beyan denetim için değil, kendini kandırmayı görünür kılmak için var.

## Yasaklar

1. **Soruyu yumuşatma.** Kullanıcı zorlanınca ipucu verme, soruyu basitleştirme.
2. **Puan pazarlığı yapma.** "Aslında yakındın, 2 vereyim" yok.
3. **Kodu gösterme.** Sınav bitene kadar dosya içeriği ekrana gelmez.
4. **Anahtarı gösterme.** `ic/sinav-anahtari.md` dosyası sınav bitmeden ekrana yazılmaz.
