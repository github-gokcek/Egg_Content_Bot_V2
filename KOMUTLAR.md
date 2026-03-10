# Egg Content Bot V2 - Komut Listesi

Discord sunucunuz için LoL & TFT maç yönetimi botunun tüm komutları.

---

## 📋 Genel Komutlar

### `/ping`
Bot'un gecikme süresini gösterir.

### `/yardim`
Bot hakkında detaylı yardım menüsü. Farklı konular hakkında bilgi alabilirsiniz:
- 🎮 Oyun Sistemi
- 👥 Grup Sistemi
- 💰 Bakiye Sistemi
- ⚔️ Düello Sistemi
- 🏴☠️ Faction Sistemi
- 📋 Tüm Komutlar

---

## 👤 Kullanıcı Komutları

### `/kayit`
Sunucuya oyuncu olarak kaydolun.
- **Parametreler:**
  - `lol_ign`: League of Legends kullanıcı adınız
  - `tft_ign`: Teamfight Tactics kullanıcı adınız

### `/profil`
Bir oyuncunun profilini görüntüleyin.
- **Parametreler:**
  - `kullanici` (opsiyonel): Görüntülenecek kullanıcı

### `/bakiye`
Bakiyenizi veya başka bir kullanıcının bakiyesini kontrol edin.
- **Parametreler:**
  - `kullanici` (opsiyonel): Bakiyesi görüntülenecek kullanıcı

### `/liderlik`
Liderlik tablosunu görüntüleyin.
- **Parametreler:**
  - `kategori`: Bakiye, LoL kazanma, TFT kazanma vb.

### `/oyuncular`
Kayıtlı tüm oyuncuları listeleyin (sayfalama ile).

---

## 🎮 Oyun Komutları

### `/oyun_kur`
LoL veya TFT maçı oluşturun.
- Oyun modu seçimi (LoL: Summoner's Rift/ARAM, TFT: Solo/Double Up)
- Otomatik takım oluşturma
- Ses kanalı yönetimi

### `/oyun_win`
LoL maçının kazananını belirleyin.
- **Parametreler:**
  - `game_id`: Maç ID'si
  - `kazanan`: Mavi veya Kırmızı takım

### `/tft_win`
TFT maçının sıralamasını girin.
- **Parametreler:**
  - `game_id`: Maç ID'si
  - `birinci`, `ikinci`, `ucuncu`, `dorduncu`: Sıralama
  - `besinci`, `altinci`, `yedinci`, `sekizinci` (opsiyonel)

### `/oyun_iptal`
Bir maçı iptal edin.
- **Parametreler:**
  - `game_id`: İptal edilecek maç ID'si

---

## 👥 Grup Komutları

### `/grup olustur`
Yeni bir grup oluşturun.
- **Parametreler:**
  - `isim`: Grup adı

### `/grup davet`
Grubunuza kullanıcı davet edin.
- **Parametreler:**
  - `kullanici`: Davet edilecek kullanıcı

### `/grup bilgi`
Grubunuzun bilgilerini görüntüleyin.

### `/grup cik`
Bulunduğunuz gruptan ayrılın.

---

## ⚔️ Düello Komutları

### `/duello challenge`
Başka bir oyuncuya düello teklif edin.
- **Parametreler:**
  - `rakip`: Düello yapılacak oyuncu
  - `miktar`: Bahis miktarı (coin)

### `/duello sonuc`
Düello sonucunu girin.
- **Parametreler:**
  - `duello_id`: Düello ID'si
  - `kazanan`: Kazanan oyuncu

---

## 🏴☠️ Faction Komutları

### `/faction join`
Bir faction'a katılın.
- **Parametreler:**
  - `faction`: Demacia veya Bilgewater

### `/faction progress`
Faction ilerlemenizi görüntüleyin.

### `/faction upgrade`
Faction tier'ınızı yükseltin (Tier 2).

### `/faction info`
Faction bilgilerinizi görüntüleyin.

### `/faction_store`
Faction mağazasından item satın alın.

### `/faction_leaderboard`
Faction liderlik tablosunu görüntüleyin.
- **Parametreler:**
  - `type`: FP, Haftalık FP, Günlük Ses

### `/faction_match`
Faction vs Faction maçı oluşturun (Admin).
- **Parametreler:**
  - `faction_a`: İlk faction
  - `faction_b`: İkinci faction
  - `tier2_only`: Sadece Tier 2 oyuncular

---

## 🛒 Market Komutları

### `/market list`
Satılık rolleri listeleyin.

### `/market buy`
Bir rol satın alın.
- **Parametreler:**
  - `rol`: Satın alınacak rol

### `/market admin`
Market yönetimi (Admin).
- **Parametreler:**
  - `action`: Ekle, Çıkar, Güncelle
  - `rol`: İşlem yapılacak rol
  - `fiyat`: Rol fiyatı

---

## 🎭 Rol Komutları

### `/rol ver`
Rol seçim mesajını gönderin (Admin).
- Kullanıcılar butonlara tıklayarak rol alır/çıkarır

### `/adminrol rol ekle`
Rol seçim menüsüne rol ekleyin (Admin).
- **Parametreler:**
  - `rol`: Eklenecek rol

### `/adminrol rol cikar`
Rol seçim menüsünden rol çıkarın (Admin).
- **Parametreler:**
  - `rol`: Çıkarılacak rol

### `/adminrol rol liste`
Rol seçim menüsündeki rolleri listeleyin (Admin).

---

## 📢 Duyuru Komutları

### `/duyuru`
Belirli bir role sahip herkese DM gönderin (Admin).
- **Parametreler:**
  - `rol`: Mesaj gönderilecek rol
  - `mesaj`: Gönderilecek mesaj içeriği

---

## 🏠 Özel Oda Komutları

### `/ozeloda trigger`
Özel oda trigger kanalını ayarlayın (Admin).
- **Parametreler:**
  - `kanal`: Trigger ses kanalı
- Kullanıcılar bu kanala girdiğinde otomatik özel oda oluşturulur

---

## 📰 Patch Notları Komutları

### `/setpatch`
Patch notları kanalını ayarlayın (Admin).
- **Parametreler:**
  - `kanal`: Patch notlarının paylaşılacağı kanal
- Her 10 dakikada bir yeni LoL/TFT patch notlarını kontrol eder

### `/testpatch`
Son patch notlarını manuel olarak getirin (Admin - Test için).
- **Parametreler:**
  - `oyun`: LoL, TFT veya Her İkisi

---

## ⚙️ Admin Komutları

### `/admin test`
Test etkinliği duyurusu gönderin (Admin).

### `/bakiye_yonet`
Kullanıcı bakiyesini yönetin (Admin).
- **Parametreler:**
  - `kullanici`: İşlem yapılacak kullanıcı
  - `islem`: Ekle veya Çıkar
  - `miktar`: Coin miktarı

### `/faction_admin award_fp`
Kullanıcıya FP verin (Admin).
- **Parametreler:**
  - `user`: Kullanıcı
  - `amount`: FP miktarı
  - `reason`: Sebep

### `/faction_admin reset_weekly`
Haftalık FP'leri sıfırlayın (Admin).

### `/faction_admin reset_daily_voice`
Günlük ses FP'lerini sıfırlayın (Admin).

### `/bot status`
Bot durumunu görüntüleyin (Admin).

### `/bot mode`
Bot modunu değiştirin (Admin).
- **Parametreler:**
  - `mod`: Normal veya Bakım

### `/clear`
Mesajları toplu olarak silin (Admin).
- **Parametreler:**
  - `sayi`: Silinecek mesaj sayısı (1-100)

### `/disable game_channel`
Oyun kanalını devre dışı bırakın (Admin).
- **Parametreler:**
  - `oyun`: LoL veya TFT

### `/disable winnerlog_channel`
Sonuç kanalını devre dışı bırakın (Admin).
- **Parametreler:**
  - `oyun`: LoL veya TFT

---

## 📊 Özellikler

### Otomatik Sistemler
- ✅ Ses kanalı aktivite takibi
- ✅ Otomatik maç kanalları oluşturma/silme
- ✅ Özel oda sistemi (trigger kanalı)
- ✅ Patch notları otomatik paylaşımı (10 dakikada bir)
- ✅ Faction FP kazanımı (ses kanalı, maç kazanma)
- ✅ Firebase ile kalıcı veri saklama

### Rol Sistemi
- Kullanıcılar butonlarla rol alır/çıkarır
- Admin tarafından yönetilebilir rol listesi
- Bot yeniden başlatılsa bile çalışır

### Özel Oda Sistemi
- Trigger kanalına girince otomatik oda açılır
- Oda sahibi: susturma, atma, kanal düzenleme yetkisi
- Default 5 kişi limiti (değiştirilebilir)
- Oda boşalınca otomatik silinir
- Tüm odalar boşalınca kategori de silinir

### Patch Notları Sistemi
- Her 10 dakikada bir kontrol
- LoL ve TFT için ayrı ayrı
- Türkçe patch notları
- Patch highlights resmi ile birlikte
- @LoL ve @TFT rolleri etiketlenir

---

## 🔗 Linkler

- **GitHub:** https://github.com/github-gokcek/Egg_Content_Bot_V2
- **Dashboard:** https://egg-content-bot-v2-dashboard.onrender.com

---

## 📝 Notlar

- Tüm veriler Firebase Firestore'da saklanır
- Bot yeniden başlatılsa bile tüm ayarlar korunur
- Komutların çoğu sadece kayıtlı oyuncular tarafından kullanılabilir
- Admin komutları için Administrator yetkisi gereklidir
