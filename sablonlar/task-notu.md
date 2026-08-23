# Task notu şablonları — terminalsiz Claude ortamı

Bu şablonlar **task tabanlı** Claude ortamı içindir: task açarsın → nota prompt yazarsın →
dosya eklersin → repo seçersin → önce plan çıkar → onaylarsın → çalışır.

Kullanım: bloğu kopyala, `<...>` alanlarını doldur, task'ın **not** kısmına yapıştır.

Kapsam: **doğrulama + analist test paketi.** Kavrayış sınavı (`/dv-kavra`) bu ortamda
koşmaz — interaktif soru-cevap ister. Onu Copilot, Windsurf ya da erişimin olan başka bir
canlı araçta kendin koşarsın.

---

## Değişmez kural: doğrulama kendi task'ıdır

Kodu yazan task ile doğrulayan task **aynı task olamaz.** Terminal akışındaki KAPI 0
(oturum tazeliği) burada bu kurala dönüşür ve yapısal olarak sağlanır — tek şartla:
aynı notta hem "şunu yaz" hem "şunu doğrula" demeyeceksin.

Aynı task'ta yazıp doğrulayan bağlam, aynı hatalı varsayımı hem yazarken hem kontrol
ederken taşır. Doğrulamanın bağımsızlığı buradan çöker.

---

## TASK — Doğrulama

```
Bu bir DOĞRULAMA görevidir. Ürün kodu YAZMAYACAKSIN.

Repo kökündeki .claude/skills/dv-dogrula/SKILL.md dosyasını oku ve oradaki kapıları
sırayla uygula.

Analiz dokümanı : <ekteki analiz.md | dogrulama/<tarih>-<konu>/00-analiz.md>
Kapsam          : <MOD A: "<base-branch> ile bu branch arasındaki diff">
                  <MOD B: "diff yok — kapsamı analizden yola çıkarak sen keşfet">
Konu            : <kisa-kebab-case>

YASAK:
- Ürün kodunda tek satır değişiklik. Bulgu bulsan bile DÜZELTME, sadece raporla.
- Test dosyası yazmak veya var olanı değiştirmek.
- Bulguyu kendin üretmek veya elemek. Üretmek dv-celiskici'nin, elemek
  dv-curutucu'nun işi.

Yazma izni olan tek yer: dogrulama/<tarih>-<konu>/ klasörü.

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

**Neden plan aşamasında bunlar?** Platformun zorunlu plan onayı, B modundaki kapsam
onayının (KAPI 2) yerine geçer. Bu durak atlanırsa sistem yanlış kod üzerinde kusursuz
çalışır ve tertemiz bir rapor üretir — sahte güvenin en kötü hali.

**4. madde neden var?** Tüm bağımsızlık modeli alt agent'ların temiz bağlamına dayanıyor.
Ortam alt agent desteklemiyorsa zincir yine koşar ama bağımsızlık zayıflar; bunu bilerek
onaylaman gerekir, fişe de yazılır.

---

## Task bittikten sonra — çıktıyı kullan

Çıktı **commit olarak** gelir; task'ın dosya yazması bu yüzden istenen şeydir. Yasak
olan yazmak değil, `dogrulama/` **dışına** yazmak.

Branch'i çek, önce nereye yazıldığına bak:

```bash
git diff --name-only <base-branch>...HEAD | grep -v '^dogrulama/'
```

Boş dönmeli. Dönmezse doğrulama ürün koduna dokunmuş — fiş kapatılamaz, temiz branch'te
yeniden koş.

Sonra `dogrulama/<tarih>-<konu>/` altında:

| Dosya | Kime gider | Ne yapılır |
|---|---|---|
| `05-fis.md` | Sana | Önce bunu oku. Durum `KAPATILAMADI` ise altındaki sebepleri kapat |
| `01-rtm.md` | Sana | `❌` ve `➕` satırları — en değerli çıktı |
| `02-bulgular.md` | Sana | Ayakta kalan P1/P2 bulgular |
| `04a-analist-test-paketi.md` | Analistlere | Confluence'a yapıştır (aşağıda) |
| `04b-developer-kontrol-listesi.md` | Sana | Confluence'a **gitmez**, teknik detay içerir |
| `04c-*` | Analistlere | Varsa, kapsam/kapsam dışı notu |

### `04a`'yı Confluence'a taşıma

1. Analiz sayfasının altında yeni sayfa: `DV-<tarih>-<konu> Test Paketi`
2. Label: `dogrulama-test`
3. `Insert → Markup → Confluence Wiki` → `04a` içeriğini yapıştır
4. Menü kapalıysa `04a` içindeki HTML tablo alternatifini kullan

`(*)` işaretli satırlar köprüden gelen senaryolardır — statik analizle emin olunamayan
noktalar. Analistin bunları atlamaması gerekir, ama teknik sebebi Confluence'a yazılmaz.

---

## Analiz dokümanını nereye koyacaksın

| Yol | Nasıl | Ne zaman |
|---|---|---|
| Ek dosya | Task'a `analiz.md` ekle, notta "ekteki analiz.md" de | Tek seferlik |
| Repoda | `dogrulama/<tarih>-<konu>/00-analiz.md` olarak commit'le | Denetim izi isteniyorsa |

Repoya koymak daha sağlam: analiz, RTM ve fiş aynı commit'te durur. Altı ay sonra
"hangi analize göre doğrulandı" sorusunun cevabı repoda kalır.

---

## Çoklu repo seçimi

Platform birden fazla repo seçmene izin veriyorsa, doğrulama kitini ayrı bir repoda
tutup ürün reposuyla birlikte seçmeyi deneyebilirsin — kiti her repoya kopyalamak
gerekmez.

**Önce test et:** skill'lerin ana repo dışından yüklenip yüklenmediği ortama bağlı.
Yüklenmiyorsa varsayılana dön — kiti ürün reposunun köküne kopyala
(bkz. `KURULUM-TASK-MODU.md`).

---

## Sık yapılan hata

| Hata | Sonucu |
|---|---|
| Notta "doğrula ve düzelt" demek | Doğrulayan taraf düzeltir; bağımsızlık biter |
| Kodlama ve doğrulamayı aynı task'a koymak | Aynı bağlam hem yazar hem kontrol eder |
| Analizi eklemeden koşmak | Oracle yok. Çıktı doğrulama değil, kod okuma olur |
| Plan onayında kapsamı okumadan onaylamak | Sistem yanlış kod üzerinde kusursuz çalışır |
| `04b`'yi Confluence'a yapıştırmak | Teknik detay dışarı sızar |
| Fiş `KAPATILAMADI` iken merge etmek | Fişin tek işlevi buydu |
