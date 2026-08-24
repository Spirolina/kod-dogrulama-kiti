# Analiz — Kart İşlemleri Ekranı

Bu doküman üç bölüme ayrılmıştır. Bölümler paketin fonksiyonel bölümlerinin kaynağıdır.

## 1. Kart görünümü

**R-01** Kart listesinde her kartın son dört hanesi ve kart tipi gösterilecektir.

**R-02** Bloke edilmiş kartlar gri renkte ve "Bloke" etiketiyle gösterilecektir.

**R-03** Tüzel müşterilerde kart listesinde ayrıca kartın bağlı olduğu firma adı
gösterilecektir. Bireysel müşterilerde firma adı alanı hiç görünmeyecektir.

## 2. Limit ve harcama

**R-04** Kartın kalan limiti kart detayında gösterilecektir.

**R-05** Kalan limit sıfır ise "Limitiniz doldu" uyarısı görünecektir.

**R-06** Harcama tutarı kalan limiti aşarsa işlem reddedilecek ve "Limit yetersiz"
mesajı gösterilecektir. Girilen tutar alanda korunacaktır.

**R-07** Harcama tutarı kalan limite tam olarak eşitse işlem kabul edilecektir.

## 3. Hata durumları

**R-08** Kart listesi servisi yanıt vermezse "Kartlarınız yüklenemedi" mesajı
gösterilecek, boş liste gösterilmeyecektir.

**R-09** Limit sorgusu yanıt vermezse kart detayında limit alanı yerine "Limit bilgisi
alınamadı" yazacaktır. Kartın diğer bilgileri görünmeye devam edecektir.

## Müşteri türleri

Bireysel ve tüzel müşteri akışları vardır. Tek fark R-03'tedir; diğer tüm gereksinimler
iki akışta da aynı davranır.
