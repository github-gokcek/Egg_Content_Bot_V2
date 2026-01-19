import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Bot hakkında yardım al')
    .addStringOption(option =>
      option.setName('konu')
        .setDescription('Hangi konu hakkında yardım almak istiyorsun?')
        .setRequired(true)
        .addChoices(
          { name: '🎮 Oyun Sistemi', value: 'oyun' },
          { name: '👥 Grup Sistemi', value: 'grup' },
          { name: '💬 Mesaj Sistemi', value: 'mesaj' },
          { name: '💰 Bakiye Sistemi', value: 'bakiye' },
          { name: '⚔️ Düello Sistemi', value: 'duello' },
          { name: '🏴☠️ Faction Sistemi', value: 'faction' },
          { name: '📋 Tüm Komutlar', value: 'komut' },
          { name: '🚀 Başlangıç Rehberi', value: 'onboarding' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const topic = interaction.options.getString('konu', true);

    // Onboarding komutu sadece adminler kullanabilir
    if (topic === 'onboarding') {
      const isAdmin = interaction.memberPermissions?.has('Administrator');
      if (!isAdmin) {
        return interaction.reply({ 
          content: '❌ Bu komut sadece adminler tarafından kullanılabilir!', 
          ephemeral: true 
        });
      }
    }

    let embed: EmbedBuilder;

    switch (topic) {
      case 'oyun':
        embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle('🎮 Oyun Sistemi Rehberi')
          .setDescription('**League of Legends** ve **Teamfight Tactics** maçları nasıl kurulur ve yönetilir?')
          .addFields(
            {
              name: '📝 Oyun Kurma',
              value: `**LoL Maçları:**
\`\`\`
/oyun_kur lol summoners_rift
/oyun_kur lol aram
\`\`\`

**TFT Maçları:**
\`\`\`
/oyun_kur tft solo
/oyun_kur tft double_up
\`\`\`

• Oyun kurulduktan sonra **katıl** butonuna basarak maça katılabilirsin
• LoL maçlarında takım seçimi yapabilirsin (🔵 Mavi / 🔴 Kırmızı)
• TFT maçlarında sıralama sistemine göre yerleşim yapılır`,
              inline: false
            },
            {
              name: '🏆 Kazanan Girme',
              value: `**Sadece maçı oluşturan kişi veya adminler sonuç girebilir:**

\`\`\`
/oyun_win MAÇID blue
/oyun_win MAÇID red
\`\`\`

**TFT için:**
\`\`\`
/tft_win MAÇID @oyuncu1 @oyuncu2 @oyuncu3
\`\`\`

• Maç ID'sini oyun mesajından kopyalayabilirsin
• Kazanan takım/oyuncular otomatik olarak +10 bakiye alır
• Sonuçlar log kanalına otomatik kaydedilir`,
              inline: false
            },
            {
              name: '🔧 Oyun Yönetimi',
              value: `**Maç İptal Etme:**
\`\`\`
/oyun_iptal MAÇID
\`\`\`

**Ses Kanalları:**
• Maç başladığında otomatik ses kanalları oluşturulur
• Maç bittiğinde kanallar otomatik silinir
• Manuel olarak kanalları yönetebilirsin`,
              inline: false
            }
          )
          .setFooter({ text: 'İyi oyunlar! 🎮' });
        break;

      case 'grup':
        embed = new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle('👥 Grup Sistemi Rehberi')
          .setDescription('Arkadaşlarınla grup kurarak birlikte oyun oynayın!')
          .addFields(
            {
              name: '🎯 Grup Kurma',
              value: `**Grup Oluştur:**
\`\`\`
/grup_kur "Grup Adı" 5
\`\`\`

• Grup adı ve maksimum üye sayısını belirle
• Sen otomatik olarak grup lideri olursun
• Grup kurulduktan sonra davet linkini paylaşabilirsin`,
              inline: false
            },
            {
              name: '📨 Davet Sistemi',
              value: `**Kişileri Davet Et:**
\`\`\`
/grup_davet @kullanici1 @kullanici2
\`\`\`

• Davet edilen kişilere **DM** gönderilir
• DM'de **Kabul Et** ve **Reddet** butonları bulunur
• Davet 5 dakika içinde cevaplanmazsa otomatik iptal olur

**Davet Mesajı Örneği:**
\`\`\`
🎮 Grup Daveti!

Seni "Efsane Takım" grubuna davet ediyor!
Grup Lideri: @kullanici
Üye Sayısı: 3/5

[Kabul Et] [Reddet]
\`\`\``,
              inline: false
            },
            {
              name: '⚙️ Grup Yönetimi',
              value: `**Grup Bilgisi:**
\`\`\`
/grup_bilgi
\`\`\`

**Gruptan Ayrıl:**
\`\`\`
/grup_ayril
\`\`\`

**Grup Dağıt (Sadece Lider):**
\`\`\`
/grup_dagit
\`\`\`

• Grup lideri istediği zaman grubu dağıtabilir
• Üyeler istedikleri zaman ayrılabilir
• Lider gruptan ayrılırsa grup otomatik dağılır`,
              inline: false
            }
          )
          .setFooter({ text: 'Birlikte daha güçlüyüz! 👥' });
        break;

      case 'mesaj':
        embed = new EmbedBuilder()
          .setColor(0xe67e22)
          .setTitle('💬 Mesaj Sistemi Rehberi')
          .setDescription('Bot üzerinden diğer oyunculara nasıl mesaj gönderilir?')
          .addFields(
            {
              name: '📤 Mesaj Gönderme',
              value: `**Tek Kişiye Mesaj:**
\`\`\`
/mesaj @kullanici "Merhaba! Oyun oynamak ister misin?"
\`\`\`

**Gruba Mesaj (Grup Lideri):**
\`\`\`
/grup_mesaj "Herkese merhaba! 20:00'da maç var!"
\`\`\`

• Mesajlar **DM** olarak gönderilir
• Alıcı mesajı **Kabul Et** veya **Reddet** edebilir
• Spam koruması vardır (dakikada maksimum 3 mesaj)`,
              inline: false
            },
            {
              name: '📨 Mesaj Alma',
              value: `**Gelen Mesaj Örneği:**
\`\`\`
💬 Yeni Mesaj!

Gönderen: @kullanici
Mesaj: "Merhaba! Oyun oynamak ister misin?"

[Kabul Et] [Reddet]
\`\`\`

**Kabul Et:** Mesajı onaylar ve gönderene bildirim gider
**Reddet:** Mesajı reddeder, gönderen bilgilendirilir`,
              inline: false
            },
            {
              name: '🛡️ Güvenlik',
              value: `**Spam Koruması:**
• Dakikada maksimum 3 mesaj gönderebilirsin
• Aynı kişiye 1 dakikada sadece 1 mesaj

**Engelleme:**
• İstemediğin mesajları reddet
• Sürekli spam yapan kullanıcılar otomatik engellenir
• Adminler tüm mesaj geçmişini görebilir`,
              inline: false
            }
          )
          .setFooter({ text: 'Saygılı iletişim kurallarını unutma! 💬' });
        break;

      case 'bakiye':
        embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle('💰 Bakiye Sistemi Rehberi')
          .setDescription('Oyun içi ekonomi sistemi nasıl çalışır?')
          .addFields(
            {
              name: '💳 Bakiye Kazanma',
              value: `**Başlangıç Bakiyesi:**
• Kayıt olduğunda **100 coin** ile başlarsın

**Oyun Kazançları:**
\`\`\`
LoL Maç Kazanma: +10 coin
TFT İlk 3'e Girme: +10 coin
Düello Kazanma: Bahis miktarı kadar
\`\`\`

**Günlük Bonus:**
\`\`\`
/gunluk_bonus
\`\`\`
• Her 24 saatte bir **5 coin** alabilirsin`,
              inline: false
            },
            {
              name: '🛒 Bakiye Kullanma',
              value: `**Market Alışverişi:**
\`\`\`
/market
\`\`\`
• Rol satın al/sat
• Fiyatlar arz-talebe göre değişir

**Düello Bahisleri:**
\`\`\`
/duello @rakip 50
\`\`\`
• Rakibinle bahis oyna
• Kazanan tüm parayı alır`,
              inline: false
            },
            {
              name: '📊 Bakiye Takibi',
              value: `**Profil Görüntüleme:**
\`\`\`
/profil
/profil @kullanici
\`\`\`

**Liderlik Tablosu:**
\`\`\`
/liderlik bakiye
\`\`\`

• En zengin oyuncuları gör
• Kendi sıralamandaki yerini öğren
• Haftalık/aylık istatistikler`,
              inline: false
            }
          )
          .setFooter({ text: 'Akıllıca harca, çok kazan! 💰' });
        break;

      case 'duello':
        embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('⚔️ Düello Sistemi Rehberi')
          .setDescription('Diğer oyuncularla 1v1 düello yaparak coin kazan!')
          .addFields(
            {
              name: '🎯 Düello Başlatma',
              value: `**Düello Teklifi:**
\`\`\`
/duello @rakip 50
\`\`\`

• Rakibini seç ve bahis miktarını belirle
• Minimum bahis: **10 coin**
• Maksimum bahis: Sahip olduğun coin miktarı
• Rakibin de yeterli bakiyesi olmalı`,
              inline: false
            },
            {
              name: '🎮 Düello Türleri',
              value: `**Mevcut Düello Türleri:**

**🎲 Zar Atma:**
• Her oyuncu 1-100 arası zar atar
• Yüksek sayı kazanır
• Eşitlik durumunda tekrar atılır

**🃏 Kart Çekme:**
• Standart 52'lik desteden kart çekilir
• Yüksek kart kazanır (As en yüksek)
• Eşitlik durumunda tekrar çekilir

**⚡ Hızlı Tıklama:**
• 10 saniye içinde butona en çok tıklayan kazanır
• Spam koruması vardır`,
              inline: false
            },
            {
              name: '📋 Düello Süreci',
              value: `**1. Teklif Gönderme:**
\`\`\`
/duello @rakip 50
\`\`\`

**2. Rakip Cevabı:**
• **Kabul Et** - Düello başlar
• **Reddet** - Düello iptal olur
• 2 dakika cevap verilmezse otomatik iptal

**3. Oyun Seçimi:**
• Düello türü rastgele seçilir
• Her iki oyuncu da aynı oyunu oynar

**4. Sonuç:**
• Kazanan tüm bahis miktarını alır
• Sonuç log kanalına kaydedilir`,
              inline: false
            }
          )
          .setFooter({ text: 'Şansını dene, ama dikkatli ol! ⚔️' });
        break;

      case 'faction':
        embed = new EmbedBuilder()
          .setColor(0xf39c12)
          .setTitle('🏴☠️ Faction Sistemi Rehberi')
          .setDescription('League of Legends evrenindeki bölgelere özel faction sistemi!')
          .addFields(
            {
              name: '🎯 Faction Nedir?',
              value: `**Faction sistemi ile:**
• Bir bölgeye ait olursun (Demacia, Bilgewater)
• Aktivitelerle **Faction Points (FP)** kazanırsın
• FP ile tier yükseltir ve özel itemler alırsın
• Faction vs Faction maçlarına katılırsın`,
              inline: false
            },
            {
              name: '💰 Faction Katılma',
              value: `**Tier 1 Satın Al:**
\`\`\`
/faction join faction:Demacia
\`\`\`
• Fiyat: **50 coin**
• FP kazanmaya başlarsın`,
              inline: false
            },
            {
              name: '💎 FP Kazanma',
              value: `**Nasıl FP Kazanılır:**
• Maç kazanma: **15 FP**
• Maç tamamlama: **10 FP**
• Ses kanalı: **1 FP/10dk**

**Progress Boost:**
• %33: **+10% FP**
• %66: **+20% FP**`,
              inline: false
            },
            {
              name: '⬆️ Tier 2',
              value: `\`\`\`
/faction upgrade
\`\`\`
• Gerekli: **500 FP**
• Faction maçlarına katıl`,
              inline: false
            },
            {
              name: '📊 Diğer Komutlar',
              value: `\`/faction progress\` - İlerleme
\`/faction_store\` - Mağaza
\`/faction_leaderboard\` - Sıralama
\`/faction_match\` - Faction maçı`,
              inline: false
            }
          )
          .setFooter({ text: 'Factionını seç, güçlendir! 🏴☠️' });
        break;

      case 'komut':
        embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('📋 Tüm Komutlar')
          .setDescription('Botun tüm komutlarının kısa açıklamaları:')
          .addFields(
            {
              name: '🎮 Oyun Komutları',
              value: `\`/oyun_kur\` - LoL/TFT maçı kur
\`/oyun_win\` - Maç sonucunu gir
\`/oyun_iptal\` - Maçı iptal et
\`/tft_win\` - TFT sonucunu gir`,
              inline: true
            },
            {
              name: '👥 Grup Komutları',
              value: `\`/grup_kur\` - Grup oluştur
\`/grup_davet\` - Kişileri davet et
\`/grup_bilgi\` - Grup bilgilerini gör
\`/grup_ayril\` - Gruptan ayrıl
\`/grup_dagit\` - Grubu dağıt`,
              inline: true
            },
            {
              name: '💰 Ekonomi Komutları',
              value: `\`/market\` - Rol al/sat
\`/duello\` - Düello başlat
\`/profil\` - Profil görüntüle
\`/liderlik\` - Liderlik tablosu`,
              inline: true
            },
            {
              name: '🏴☠️ Faction Komutları',
              value: `\`/faction\` - Faction sistemi
\`/faction_store\` - FP mağazası
\`/faction_leaderboard\` - Sıralama
\`/faction_match\` - Faction maçı`,
              inline: true
            },
            {
              name: '💬 İletişim Komutları',
              value: `\`/mesaj\` - Mesaj gönder
\`/grup_mesaj\` - Gruba mesaj`,
              inline: true
            },
            {
              name: '⚙️ Yönetim Komutları',
              value: `\`/set\` - Kanal ayarları
\`/bot\` - Bot durumu
\`/kayit\` - Oyuncu kaydı`,
              inline: true
            },
            {
              name: '❓ Yardım',
              value: `\`/yardim\` - Bu yardım menüsü
\`/ping\` - Bot gecikmesi`,
              inline: true
            }
          )
          .setFooter({ text: 'Detaylı bilgi için /yardim [konu] kullan!' });
        break;

      case 'onboarding':
        embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('# 🚀 Hoş Geldin! Bot Kullanım Rehberi')
          .setDescription('## **Merhaba!** Bu sunucuda oyun oynamak için botumuzla tanışman gerekiyor. Merak etme, çok kolay! 😊')
          .addFields(
            {
              name: '# 📱 Discord Slash Komutları Nedir?',
              value: `## Discord'un **modern komut sistemi**ni kullanıyoruz. Bu çok kolay!

## **Nasıl Çalışır:**
### 1️⃣ Mesaj kutusuna \`/\` (slash) yaz
### 2️⃣ Komut listesi çıkacak, istediğini seç
### 3️⃣ Gerekli bilgileri doldur
### 4️⃣ Enter'a bas!

## **Örnek:**
### \`\`\`
/ping
\`\`\`
## Bu komutu yazıp Enter'a basarsan bot sana cevap verecek! 🏓`,
              inline: false
            },
            {
              name: '# 📝 İLK İŞ: Kayıt Ol!',
              value: `## **Oyun oynamadan önce mutlaka kayıt olmalısın:**

### \`\`\`
/kayit "LoL_Kullanici_Adin#TAG" "TFT_Kullanici_Adin#TAG"
\`\`\`

## **⚠️ ÖNEMLİ:** Riot hesap adınızı yazarken **#** ile başlayan etiketinizi de eklemeyi unutmayın!

### **Örnek:**
\`\`\`
/kayit "EfsaneOyuncu#TR1" "EfsaneOyuncu#TR1"
/kayit "ProPlayer#EUW" "TFTMaster#EUW"
\`\`\`

## **💡 İPUCU:** LoL ve TFT hesap adların aynıysa, ikisine de aynı şeyi yazabilirsin!

## **✅ Kayıt olduktan sonra:**
### • 100 coin ile başlarsın 💰
### • Oyunlara katılabilirsin 🎮
### • Profil sayfan oluşur 📊`,
              inline: false
            },
            {
              name: '# 🎮 İlk Oyununu Oyna!',
              value: `## **Kayıt olduktan sonra hemen oyun kurabilirsin:**

## **League of Legends:**
### \`\`\`
/oyun_kur lol summoners_rift
/oyun_kur lol aram
\`\`\`

## **Teamfight Tactics:**
### \`\`\`
/oyun_kur tft solo
/oyun_kur tft double_up
\`\`\`

## **Nasıl Çalışır:**
### 1️⃣ Komutu yaz ve Enter'a bas
### 2️⃣ Bot bir mesaj gönderecek
### 3️⃣ **"Katıl"** butonuna bas
### 4️⃣ Diğer oyuncuların katılmasını bekle
### 5️⃣ Oyun başladığında otomatik ses kanalları oluşur! 🔊`,
              inline: false
            },
            {
              name: '# 💡 Komut Yazma İpuçları',
              value: `## **Kolay Yöntem:**
### • \`/\` yazdıktan sonra komut adının ilk harflerini yaz
### • Örnek: \`/oy\` yazarsan \`/oyun_kur\` çıkacak
### • Tab tuşuyla otomatik tamamlayabilirsin

## **Seçenekler:**
### • Komutlarda seçenekler varsa Discord sana gösterecek
### • Zorunlu alanlar **kırmızı** \`*\` ile işaretli
### • İsteğe bağlı alanları boş bırakabilirsin

## **Hata Yapma Korkusu:**
### • Yanlış yaparsan bot sana söyler, merak etme! 😅
### • Komutları istediğin kadar deneyebilirsin`,
              inline: false
            },
            {
              name: '# 🆘 Yardıma İhtiyacın Var mı?',
              value: `## **Detaylı yardım için:**
### \`\`\`
/yardim oyun     → Oyun sistemi
/yardim grup     → Grup kurma
/yardim mesaj    → Mesajlaşma
/yardim bakiye   → Para sistemi
/yardim duello   → Düello sistemi
/yardim komut    → Tüm komutlar
\`\`\`

## **Hızlı Başlangıç:**
### 1️⃣ \`/kayit\` ile kayıt ol
### 2️⃣ \`/oyun_kur\` ile oyun kur
### 3️⃣ \`/profil\` ile profilini gör
### 4️⃣ \`/yardim\` ile daha fazla öğren!

## **Takıldığın Yer Olursa:**
### • Adminlere sorabilirsin
### • \`/yardim\` komutunu kullan
### • Deneme yanılma ile öğrenebilirsin! 🎯`,
              inline: false
            }
          )
          .setFooter({ text: 'İyi oyunlar! Herhangi bir sorun olursa adminlere sor! 🎮✨' });
        break;

      default:
        embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('❌ Hata')
          .setDescription('Geçersiz yardım konusu!');
    }

    const isOnboarding = topic === 'onboarding';
    await interaction.reply({ embeds: [embed], ephemeral: !isOnboarding });
  },
};