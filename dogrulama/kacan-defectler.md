# Kaçan Defectler

Bu dosya lens paketini büyüten motordur. Doğrulama zincirinden geçip **UAT veya prod'a
ulaşan** her defect buraya yazılır ve tek bir soru sorulur:

> **Hangi kapı kaçırdı?**

Cevap ya mevcut bir lense yeni kontrol maddesi, ya yeni bir lens olur — ve beraberinde
bir altın vaka gelir. Altın vaka gelmeyen ekleme, işe yaradığı hiç doğrulanmayan ekleme
demektir.

Bu dosya olmadan workflow ritüele dönüşür: koşulur, rapor üretilir, kimse iyileşip
iyileşmediğini bilmez.

---

## Buraya YAZILMAYANLAR

| Durum | Neden yazılmaz |
|---|---|
| `(*)` odak işaretli manuel test KALDI | Doğrulama bunu zaten şüpheli işaretlemişti — **yakalandı**, kaçmadı. `SONUC.md`'nin başarı hanesine yazılır |
| RTM'de `❌`/`⚠️` olarak raporlanmış eksik | Doğrulama söyledi, bilerek merge edildi. Kaçan değil, kabul edilen risk |
| `SONUC.md`'de "kalan riskler" altında yazılı olan şey | Aynı sebep — bilinen ve imzalanmış risk |
| Analiz hatası (kod analize uygun ama analiz yanlış) | Doğrulama katmanının kapsamı değil. Ayrı kayda geçer (TODOS #2) |

Sadece **hiç kimsenin öngörmediği** şeyler buraya yazılır.

---

## Kayıt

```markdown
## KD-01 · <YYYY-AA-GG> · <kısa başlık>
Nerede çıktı: <UAT | prod> · Değişiklik: <dogrulama/ klasör adı> · Kademe: T?
Ne oldu: <tek cümle, iş etkisiyle>
Kök neden: <tek cümle, teknik>
Hangi kapı kaçırdı: <G1 | G2/L? | G4 | manuel test | hiçbiri — kapsam dışıydı>
Neden kaçtı: <o kapının hangi kontrol maddesi eksikti>
Aksiyon: <lens-paketi.md'de ne değişti / hangi altın vaka eklendi>
Altın vaka: <AV-? | eklenmedi — gerekçe>
```

## Örnek

```markdown
## KD-01 · 2026-09-14 · Yabancı para transferinde tutar iki kat yazıldı
Nerede çıktı: UAT · Değişiklik: 2026-09-10-doviz-transfer · Kademe: T1
Ne oldu: USD transferlerde muhasebe kaydına tutar hem USD hem TL karşılığı olarak iki kez düştü
Kök neden: Kur çevrimi sonrası hem orijinal hem çevrilmiş tutar aynı alana yazılıyordu
Hangi kapı kaçırdı: G2/L2
Neden kaçtı: L2 kur çevrimini kontrol ediyordu ama "çevrim sonrası hangi tutar saklanıyor"
  maddesi yoktu — sadece precision ve çift çevrim bakılıyordu
Aksiyon: lens-paketi.md L2'ye "çevrim sonrası saklanan tutar hangisi, ikisi birden mi
  yazılıyor" kontrolü eklendi
Altın vaka: AV-9 eklendi
```

---

## Metrikler

Ayda bir bakılır. Trend önemli, mutlak sayı değil.

| Metrik | Nereden | Neye bakılır |
|---|---|---|
| Kaçan defect / değişiklik | bu dosya + sonuç dosyası sayısı | düşüyor mu |
| Hangi kapı en çok kaçırıyor | bu dosyadaki dağılım | o kapıya yatırım yap |
| Yanlış pozitif oranı | sonuç dosyalarıdeki çürütme oranı | %80 üstüne çıkıyorsa tarama gevşiyor |
| Viva skor trendi | sonuç dosyaları | yükseliyor mu — kavrayış gerçekten artıyor mu |
| Kapı başına süre | sonuç dosyaları | duvar saati hedefi tutuyor mu |

---

# Kayıtlar

*(Henüz kayıt yok. İlk kaçan defect buraya yazılacak.)*
