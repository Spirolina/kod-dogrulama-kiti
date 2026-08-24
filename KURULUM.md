# Kurulum ve Taşıma

Bu paket **saf markdown**. Hiçbir şey kurulmaz, derlenmez, indirilmez.
İnternet, npm, pip, MCP sunucusu gerekmez.

**Terminal erişimin yoksa** (task açıp not yazarak çalışan bir Claude ortamı) bu dosya
değil, **`KURULUM-TASK-MODU.md`** senin için.

## Hedef mimari

Bu paket **her MFE ayrı WebView'da çalışan React uygulamaları** mimarisine göre yazıldı
(Module Federation yok). Native kabuk kapsam dışıdır — doğrulama yalnız React kodunu görür ve
bulgular her zaman bu repoda düzeltilebilir olmalıdır. Lens paketi (`sablonlar/lens-paketi.md`) bu varsayım üzerine kurulu:
JS float aritmetiği, React render kuralları, native köprü sözleşmesi, MFE yükleme sınırı,
mobil UX. Farklı bir stack'e taşınırsa lens paketi yeniden yazılmalıdır.

## Gereken tek şey

Hedef ortam **subagent (Agent) çağırabiliyor** olmalı. Doğrulamanın bağımsızlığı
subagent'ın temiz bağlamından geliyor.

Kontrol: bir oturumda herhangi bir subagent çağrılabiliyorsa yeterli.

**Yoksa zincir yine koşar** ama `SIRALI MOD`'a düşer (bkz. `dv-dogrula` KAPI 4): lensler
tek tek, aynı bağlamda koşulur, çürütme ayrı geçişte yapılır, `SONUC.md`'ye
`Bağımsızlık: ZAYIF` yazılır. Bu bir düşüştür — erken bulgular geç bulguları etkiler.
Eşdeğer sayma.

## Kurulum

```bash
git clone <github-url> /tmp/dv
cd <hedef-repo>

cp /tmp/dv/.claude/agents/dv-*.md        .claude/agents/
cp -r /tmp/dv/.claude/skills/dv-dogrula  .claude/skills/
cp -r /tmp/dv/.claude/skills/dv-kavra    .claude/skills/
cp -r /tmp/dv/.claude/skills/dv-otomat   .claude/skills/
cp -r /tmp/dv/sablonlar                  .
cp -r /tmp/dv/testler                    .
mkdir -p dogrulama && cp /tmp/dv/dogrulama/kacan-defectler.md dogrulama/
cp /tmp/dv/VERSION                       .claude/DV-VERSION

cat /tmp/dv/sablonlar/gitignore-eki >> .gitignore   # tekrar varsa temizle
```

Hedef repo'da `.claude/` yoksa önce `mkdir -p .claude/agents .claude/skills`.

## Çakışma

Tüm dosyalar `dv-` önekli. Hedef repo'nun kendi agent/skill'leri varsa çakışma olmaz.
Çakışan tek dosya `.gitignore` olabilir — üzerine yazma, sonuna ekle.
Kit reposunun kendi `.gitignore`'ını kopyalama; hedef repoya giden satırlar
`sablonlar/gitignore-eki` içinde.

`sablonlar/` ve `testler/` klasör adları jeneriktir. Hedef repo'da aynı adla bir klasör
varsa `dv-sablonlar/` ve `dv-testler/` olarak kopyala ve şu dosyalardaki yolları güncelle:
`.claude/skills/dv-dogrula/SKILL.md`, `.claude/agents/dv-celiskici.md`.

## Doğrulama (kurulum sonrası)

```bash
ls .claude/agents/dv-*.md          # 6 dosya
ls .claude/skills/ | grep dv-      # 3 klasör
ls sablonlar/                      # 8 dosya (otomasyon-sozlesmesi.md dahil)
ls testler/altin-vakalar/          # 13 klasör + README
cat .claude/DV-VERSION
```

Sonra bir altın vaka koş — kurulumun gerçekten çalıştığının tek kanıtı budur:

1. Yeni oturum aç (`/clear`)
2. `/dv-dogrula`
3. Analiz: `testler/altin-vakalar/AV-2-eksik-gereksinim/analiz.md`
4. Kapsam: `testler/altin-vakalar/AV-2-eksik-gereksinim/kod/`
5. Çıktıyı `beklenen.md` ile karşılaştır — `R-03` `❌` olmalı, sonuç dosyası **KAPANMADI** olmalı

Bu koşum başarısızsa kurulum eksiktir; devam etme.

## Güncelleme

```bash
cd /tmp/dv && git pull
# Aynı cp komutları. Yalnız sablonlar/ üzerine yazarken dikkat:
# lens-paketi.md yerel olarak genişletilmiş olabilir (kaçan defect geri beslemesi).
diff /tmp/dv/sablonlar/lens-paketi.md sablonlar/lens-paketi.md
```

`lens-paketi.md` yaşayan dokümandır ve hedef ortamda büyür. Güncellemede körlemesine
üzerine yazma — `diff` al, yerel eklemeleri koru.

Güncelleme sonrası **13 altın vakanın tamamı** koşulur.

## Sürümleme

`VERSION` dosyası. Lens paketi, agent tanımı veya kapı davranışı değiştiğinde artırılır.
Hedef repo'da `.claude/DV-VERSION` olarak durur; hangi sürümle doğrulandığı `SONUC.md`'ye yazılabilir.

## Kaldırma

```bash
rm .claude/agents/dv-*.md
rm -rf .claude/skills/dv-dogrula .claude/skills/dv-kavra .claude/skills/dv-otomat
rm -rf sablonlar testler .claude/DV-VERSION
```

`dogrulama/` klasörünü silme — geçmiş sonuç dosyaları denetim izidir.
