# `/kullanıcı` Komutu Dokümantasyonu

## Genel Bakış
Kullanıcı profil bilgilerini ve profil resimlerini görüntülemek için kullanılan komut.

## Alt Komutlar

### 1. `/kullanıcı profil [kullanıcı]`
Kullanıcının detaylı profil bilgilerini görüntüler.

**Parametreler:**
- `kullanıcı` (opsiyonel): Profili görüntülenecek kullanıcı. Belirtilmezse komutu kullanan kişinin profili gösterilir.

**Gösterilen Bilgiler:**

#### 📊 Temel Bilgiler
- Discord kullanıcı adı ve ID
- Hesap oluşturma tarihi
- Bot'a kayıt tarihi
- Profil resmi (büyük boyutta)

#### 💰 Ekonomi
- Mevcut bakiye (coin)
- Ses paketleri sayısı

#### 🎤 Ses İstatistikleri
- Bugünkü ses süresi (dakika)
- Toplam ses süresi (saat ve dakika)
- Aktif ses süresi

#### 📋 Görevler
- Tamamlanan günlük görev sayısı / Toplam görev
- Özel görev durumu (Kilitli/Aktif/Tamamlandı)
- Toplam tamamlanan görev sayısı

#### 🎰 Casino İstatistikleri (Bugün)
- Slot oyun sayısı
- Blackjack oyun sayısı
- Coinflip oyun sayısı
- Crash oyun sayısı
- Mines oyun sayısı
- Toplam oyun sayısı
- Toplam kazanç (coin)
- Toplam harcama (coin)

#### 💬 Sosyal İstatistikler (Bugün)
- Gönderilen mesaj sayısı
- Verilen reaction sayısı
- Alınan reaction sayısı
- Mention edilen kişi sayısı
- Reply verilen kişi sayısı
- Kullanılan farklı emoji sayısı
- Mesaj gönderilen farklı kanal sayısı

#### 🎮 Oyun İstatistikleri
- League of Legends IGN
- TFT IGN
- LoL kazanma/kaybetme istatistikleri
- TFT maç sayısı
- TFT Top 4 sayısı
- TFT puan

#### ⏰ Aktif Saatler
- Bugün mesaj gönderilen saat dilimleri (örn: 10:00-12:00, 18:00-23:00)

### 2. `/kullanıcı resim [kullanıcı]`
Kullanıcının profil resmini 4096x4096 çözünürlükte görüntüler.

**Parametreler:**
- `kullanıcı` (opsiyonel): Resmi görüntülenecek kullanıcı. Belirtilmezse komutu kullanan kişinin resmi gösterilir.

**Özellikler:**
- En yüksek çözünürlük (4096x4096)
- Büyük boyutta embed içinde gösterim
- Orijinal boyutta indirme linki
- Geçici dosya yönetimi (5 saniye sonra otomatik silme)

## Teknik Detaylar

### Veri Kaynakları
1. **databaseService**: Player temel bilgileri (bakiye, IGN, stats)
2. **dailyStatsService**: Günlük istatistikler (casino, sosyal, voice)
3. **questService**: Görev bilgileri ve progress
4. **voiceActivityService**: Aktif ses süresi

### Hata Yönetimi
- Bot kullanıcıları için profil gösterilmez
- Kayıt olmamış kullanıcılar için uyarı mesajı
- Avatar indirme hatası durumunda fallback (direkt URL)
- Geçici dosya silme hatası loglanır ama kullanıcıyı etkilemez

### Performans
- Avatar indirme async
- Geçici dosyalar 5 saniye sonra otomatik temizlenir
- Tüm veri çekme işlemleri paralel (Promise.all kullanılabilir)

## Kullanım Örnekleri

```
/kullanıcı profil
→ Kendi profilini gösterir

/kullanıcı profil kullanıcı:@Elma
→ Elma'nın profilini gösterir

/kullanıcı resim
→ Kendi profil resmini büyük boyutta gösterir

/kullanıcı resim kullanıcı:@Elma
→ Elma'nın profil resmini büyük boyutta gösterir
```

## Görsel Tasarım

### Profil Embed
- **Renk**: Discord Blurple (#5865F2)
- **Thumbnail**: Kullanıcı avatarı (1024x1024)
- **Image**: Kullanıcı avatarı (1024x1024) - büyük gösterim
- **Fields**: 6 alan (3x2 grid)
- **Footer**: Profil ID
- **Timestamp**: Komut çalıştırma zamanı

### Resim Embed
- **Renk**: Discord Blurple (#5865F2)
- **Image**: Kullanıcı avatarı (4096x4096)
- **Description**: Kullanıcı bilgileri ve indirme linki
- **Timestamp**: Komut çalıştırma zamanı

## Güvenlik
- Bot kullanıcıları filtrelenir
- Sadece kayıtlı kullanıcılar için profil gösterilir
- Geçici dosyalar otomatik temizlenir
- Hata durumlarında hassas bilgi gösterilmez

## Gelecek İyileştirmeler
- [ ] Profil kartı (canvas ile özel tasarım)
- [ ] Karşılaştırma modu (iki kullanıcıyı karşılaştır)
- [ ] Liderboard entegrasyonu
- [ ] Rozet/başarı sistemi
- [ ] Profil özelleştirme (renk, tema)
