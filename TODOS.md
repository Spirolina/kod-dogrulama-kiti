# TODOS

Doğrulama workflow'u eng review'ından ertelenen kalemler. Her biri gerekçeli;
istemediğini sil.

## 1. Senaryo testlerini otomatikleştir (unit testten bağımsız)

> **Durum (2026-08-24):** Tasarlandı, ikiye bölündü — `OTOMASYON-PLANI.md`.
> **Faz A UYGULANDI (v0.8.0):** `GOREV: OTOMAT`, KAPI 5.6, `dv-analist-paketi` agent
> ayrımı, AV-12 altın vakası, `sablonlar/otomasyon-sozlesmesi.md`.
> **Faz B UYGULANDI (v0.9.0):** `/dv-otomat` skill + `dv-otomat-yazar` agent +
> task notu şablonu. Playwright, gerçek ortam, veri mock'u yok, hata yolları arıza
> enjeksiyonuyla. Kalan tek iş bankada: ortam ve auth bloklarını task notuna yazıp
> ilk koşumu yapmak, sonra `.env.local`'i doldurup `npx playwright test` demek.
> **Bu kalem kapandı.**
>
> **v1.0.0 eki:** analist geri bildirimiyle paket biçimi değişti ve KAPI 5.6/5.7
> takas edildi (`ANALIST-GERIBILDIRIM-PLANI.md`). Otomasyon yargısı artık gerçek
> `MT-xx` üzerinden koşuyor; koşum kanıtı olarak ekran görüntüsü üretiliyor.

**Ne:** Analist test paketindeki senaryoları elle koşmak yerine otomatik koşulabilir hale
getirmek (E2E / entegrasyon seviyesi).
**Neden:** Unit test kodlama akışında zaten yazılıyor, o kapatıldı. Ama senaryo seviyesinde
"bu akış uçtan uca çalışıyor mu" sorusunun cevabı şu an sadece analistin elinde. Elle koşum
her sürümde tekrarlanmıyor, regresyon kaçıyor.
**Artı:** `ANALISTE-GIDECEK.md` paketi zaten senaryoları tanımlı ve R-ID'ye bağlı — otomasyon için hazır girdi.
Bir kere otomatikleşen senaryo her sürümde bedava koşar.
**Eksi:** E2E altyapısı gerektirir (test ortamı, test verisi, araç). Hedef ortamda bunun var olup
olmadığı bilinmiyor. Kurulum bloke olabilir (K3 sıfır bağımlılık kısıtı).
**Bağlam:** G3 (unit test) planda kapatıldı — kodlama akışının parçası. Bu ondan farklı:
senaryo seviyesi, analist paketiyle aynı senaryolar. Önce elle koş, hangi senaryoların her
sürümde tekrarlandığını gör, sadece onları otomatikleştir.
**Bağımlı:** T3 (analist paketi üretimi) + 5 değişiklik pilotu.

## 2. Analiz kalitesi kapısı (kodlamadan önce)
**Ne:** Analiz dokümanını muğlaklık ve test edilebilirlik açısından tarayan hafif bir geçiş.
**Neden:** Çöp girer, çöp çıkar. Analiz muğlaksa RTM de doğrulama da anlamsız — sistem
yanlış şeyi doğrulamış olur.
**Artı:** Tüm zincirin girdi kalitesini yükseltir, en ucuz noktada hata yakalar.
**Eksi:** Analiz sürecine dokunmak organizasyonel iş. Kullanıcı "kodlama akışına
dokunmayalım" dedi; bu ondan öncesi, ama yine de başkasının alanı.
**Bağlam:** Ayrı bir skill olmalı (`/dv-analiz-kontrol`), doğrulama zincirinin parçası değil.
Çıktısı analiste geri bildirim, developer'a değil.
**Bağımlı:** Analist ekiple konuşma. Teknik bağımlılık yok.

## 3. PR/CI entegrasyonu
**Ne:** Kapıları PR akışına bağlamak, `SONUC.md`'yi otomatik PR açıklamasına basmak.
**Neden:** Lokal disipline bağlı süreç unutulur. PR gate'i zorlayıcıdır.
**Artı:** Doğrulama atlanamaz hale gelir, denetim izi doğal yerinde durur.
**Eksi:** PR platformu bilinmiyor (Bitbucket/GitLab/Azure DevOps?). Yanlış platforma
yazılan entegrasyon çöp.
**Bağlam:** Faz 1 lokal-önce tasarlandı, çıktılar dosya. Platform netleşince ince bir
adaptör katmanı yeter — çekirdek değişmez.
**Bağımlı:** PR platformunun netleşmesi.

## 4. Metrik dashboard'u
**Ne:** Kaçan defect oranı, viva skor trendi, yanlış pozitif oranı, kapı başına süre.
**Neden:** Ölçmezsen workflow'un çalışıp çalışmadığını bilemezsin, ritüele dönüşür.
**Artı:** Lens paketinin gerçekten iyileştiğini kanıtlar, süreci savunmayı kolaylaştırır.
**Eksi:** Faz 1'de veri yok. Erken dashboard boş grafik demek.
**Bağlam:** Önce ham kayıt yeter: `dogrulama/kacan-defectler.md` + `SONUC.md` içindeki alanlar.
5-10 değişiklik biriktikten sonra toplama anlamlı olur.
**Bağımlı:** Faz 1 pilotunun tamamlanması.

## 5. Ekip onboarding akışı
**Ne:** Yeni developer'ın workflow'a alışması için rehber + örnek koşum.
**Neden:** Ekip büyükse sonuç dosyası ve viva onboarding aracına dönüşür.
**Artı:** Kavrayış standardı kişiye bağlı olmaktan çıkar.
**Eksi:** Ekip büyüklüğü bilinmiyor. Tek kullanıcı için gereksiz.
**Bağlam:** Faz 1 tek developer varsayımıyla tasarlandı ama ölçeklenebilir — sonuç dosyası zaten
peer-review girdisi olarak okunabilir.
**Bağımlı:** Ekip büyüklüğünün netleşmesi.

## 6. C modu — analizsiz kavrama
**Ne:** Analiz dokümanı olmadan, sadece "şu modülü bana öğret" diyebilmek. RTM yok,
sadece rehberli tur + sınav.
**Neden:** Hedef ortamdaki eski koda hakim olmanın en doğrudan yolu. Analiz dokümanı olmayan
beş yıllık modüller için A ve B modu çalışmaz — ikisi de analizi oracle olarak kullanıyor.
**Artı:** Kavrayış aracını doğrulama zincirinden bağımsız hale getirir. Yeni birinin
kod tabanına girmesi, ya da senin hiç dokunmadığın bir modülü öğrenmen için tek yol.
**Eksi:** Oracle yok — "doğru mu" sorusu cevaplanamaz, sadece "ne yapıyor" cevaplanır.
Doğrulama değil, öğrenme aracı. Karıştırılırsa sahte güven üretir.
**Bağlam:** D4'te tartışıldı, A seçildi (A + B modu faz 1'e). C için `/dv-kavra`'nın
`/dv-dogrula` çıktısı olmadan tek başına çalışabilmesi gerekiyor — kapsamı kendi çizip
onaylatması, sonra tur + sınav. Teknik olarak B modunun RTM'siz hali.
**Bağımlı:** T7 (dv-kavrayis-kocu) tamamlanmalı. Sonrası küçük iş.

## 7. Repo geçmişindeki sektör kelimesi

**Ne:** `TODOS.md` ve `OTOMASYON-PLANI.md` içinde sektörü söyleyen kelime geçiyor ve
bu iki dosya zaten public commit'lerde.
**Neden:** Repo herkese açık ve jenerik bir adla duruyor. Kelime tek başına kurumu
söylemiyor ama kaynağı daraltıyor.
**Artı:** HEAD'i temizlemek beş dakikalık iş; yeni okuyan için iz kalmaz.
**Eksi:** Git geçmişi temizlenmiyor. Gerçekten silmek `filter-repo` + zorla push demek;
klonlamış biri varsa zaten geç. Yarım temizlik yanlış güven üretir.
**Bağlam:** Yeni dosyalarda kelime **geçmiyor** ve kurum içi terimler (müşteri
numarasının iç adı gibi) hiç girmedi — `ANALIST-GERIBILDIRIM-PLANI.md` §4'teki
terminoloji notu bu kuralı yazıya döktü. Kalan iş yalnız geçmiş.
**Bağımlı:** Kullanıcının risk değerlendirmesi. Teknik bağımlılık yok.
