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
          { name: '💰 Ekonomi & Casino', value: 'ekonomi' },
          { name: '⚔️ RPG Sistemi', value: 'rpg' },
          { name: '📋 Görev Sistemi', value: 'gorev' },
          { name: '🏴☠️ Faction Sistemi', value: 'faction' },
          { name: '📋 Tüm Komutlar', value: 'komut' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const topic = interaction.options.getString('konu', true);

    let embed: EmbedBuilder;

    switch (topic) {
      case 'oyun':
        embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle('🎮 Oyun Sistemi')
          .addFields(
            { name: '📝 Maç Kur', value: '`/oyun_kur lol summoners_rift`\n`/oyun_kur tft solo`', inline: false },
            { name: '🏆 Sonuç Gir', value: '`/oyun_win MAÇID blue`\n`/tft_win MAÇID @oyuncu1`', inline: false },
            { name: '❌ İptal', value: '`/oyun_iptal MAÇID`', inline: false }
          )
          .setFooter({ text: 'Maç başladığında otomatik ses kanalları oluşur!' });
        break;

      case 'grup':
        embed = new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle('👥 Grup Sistemi')
          .addFields(
            { name: '➕ Grup Kur', value: '`/grup olustur "Takım Adı" 5`', inline: false },
            { name: '📨 Davet Et', value: '`/grup davet @kullanici`', inline: false },
            { name: '📊 Bilgi', value: '`/grup bilgi`', inline: false },
            { name: '🚪 Ayrıl', value: '`/grup cik`', inline: false }
          )
          .setFooter({ text: 'Birlikte daha güçlüsünüz!' });
        break;

      case 'ekonomi':
        embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle('💰 Ekonomi & Casino')
          .addFields(
            { name: '🎰 Casino Oyunları', value: '`/coinflip 50` - Yazı tura\n`/slot 100` - Slot makinesi\n`/blackjack 200` - Blackjack\n`/crash 150` - Crash oyunu\n`/mines 100` - Mayın tarlası\n`/casino iptal` - Aktif oyunları iptal et', inline: false },
            { name: '🛒 Market', value: '`/market` - Özel eşyalar al\n• **Özel Oda** (5000 coin) - `/kisisel` ile 5 kişilik özel ses kanalı oluştur\n• **Sticker Ekleme** (2000 coin) - Sunucuya sticker ekletmek için admin bildirimi\n`/envanter` - Envanterini gör\n`/use` - Eşya kullan', inline: false },
            { name: '💳 Bakiye', value: '`/bakiye` - Bakiyeni gör\n`/transfer @kullanici 50` - Para gönder\n`/gunluk` - Günlük ödül (her 24 saatte)', inline: false },
            { name: '⚔️ Düello', value: '`/duello casino coinflip @rakip 100` - Casino düellosu (60 saniye kabul süresi)', inline: false }
          )
          .setFooter({ text: 'Akıllıca oyna, çok kazan! Casino mesajları 65 saniye sonra silinir.' });
        break;

      case 'rpg':
        embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('⚔️ RPG Sistemi')
          .addFields(
            { name: '🎯 Başlangıç', value: '`/rpg baslat` - Karakter oluştur\n`/rpg profil` - Profilini gör', inline: false },
            { name: '🗺️ Macera', value: '`/adventure` - Maceraya çık (**1 saat cooldown**)\n`/dinlen` - Dinlen ve iyileş (**1 saat cooldown, %50 HP/Mana**)', inline: false },
            { name: '👹 Raid', value: '`/raid` - Grup raid başlat (**Günde 2 raid limiti**)\nHer gece 00:00\'da limit sıfırlanır', inline: false },
            { name: '🛒 Mağaza', value: '`/rpg magaza` - Eşya al\n`/rpg envanter` - Envanterini gör', inline: false }
          )
          .setFooter({ text: 'Seviyeni yükselt, güçlen!' });
        break;

      case 'gorev':
        embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle('📋 Görev Sistemi')
          .addFields(
            { name: '📝 Görevler', value: '`/quest` - Günlük görevlerini gör\n`/quest tamamla` - Ödül topla', inline: false },
            { name: '🎯 Görev Türleri', value: '• Mesaj gönder (sabah/akşam saatlerinde)\n• Ses kanalında kal (5/15/30/60/120 dakika)\n• Casino oyna (blackjack, slot, coinflip)\n• RPG macerası\n• Emoji kullan\n• Kullanıcılarla etkileşim', inline: false },
            { name: '🆕 Ses Takibi', value: '`/ses` - Ses kanalında geçirdiğin süreyi gör\nHer gece 00:00\'da sıfırlanır', inline: false },
            { name: '🎁 Ödüller', value: 'Her görev tamamlandığında coin ve XP kazan!', inline: false }
          )
          .setFooter({ text: 'Her gün yeni görevler!' });
        break;

      case 'faction':
        embed = new EmbedBuilder()
          .setColor(0xf39c12)
          .setTitle('🏴☠️ Faction Sistemi')
          .addFields(
            { name: '🎯 Katıl', value: '`/faction join` - Faction seç (50 coin)', inline: false },
            { name: '📊 İlerleme', value: '`/faction progress` - İlerlemeyi gör\n`/faction upgrade` - Tier yükselt (500 FP)', inline: false },
            { name: '💎 FP Kazan', value: '• Maç kazan: 15 FP\n• Ses kanalı: 1 FP/10dk', inline: false },
            { name: '🏆 Sıralama', value: '`/faction_leaderboard`', inline: false }
          )
          .setFooter({ text: 'Factionını güçlendir!' });
        break;

      case 'komut':
        embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('📋 Tüm Komutlar')
          .addFields(
            { name: '🎮 Oyun', value: '`/oyun_kur` `/oyun_win` `/oyun_iptal`', inline: true },
            { name: '👥 Grup', value: '`/grup` komutları', inline: true },
            { name: '💰 Ekonomi', value: '`/coinflip` `/slot` `/blackjack` `/crash` `/mines` `/market` `/kisisel`', inline: true },
            { name: '⚔️ RPG', value: '`/rpg` `/adventure` `/dinlen` `/raid`', inline: true },
            { name: '📋 Görev', value: '`/quest` `/ses`', inline: true },
            { name: '🏴☠️ Faction', value: '`/faction` komutları', inline: true },
            { name: '🔧 Diğer', value: '`/bakiye` `/profil` `/liderlik` `/transfer` `/gunluk` `/envanter` `/use`', inline: true },
            { name: '🤖 Bot', value: '`/bot reklam` - Reklam mesajı gönder\n`/set reklam` - Reklam kanalı ayarla', inline: true }
          )
          .setFooter({ text: 'Detaylı bilgi için /yardim [konu] kullan!' });
        break;

      default:
        embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('❌ Hata')
          .setDescription('Geçersiz yardım konusu!');
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
