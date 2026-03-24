import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, User } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { dailyStatsService } from '../services/dailyStatsService';
import { questService } from '../services/questService';
import { voiceActivityService } from '../services/voiceActivityService';
import { Logger } from '../utils/logger';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kullanıcı')
    .setDescription('Kullanıcı bilgilerini görüntüle')
    .addSubcommand(subcommand =>
      subcommand
        .setName('profil')
        .setDescription('Kullanıcı profilini görüntüle')
        .addUserOption(option =>
          option.setName('kullanıcı')
            .setDescription('Profili görüntülenecek kullanıcı')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('resim')
        .setDescription('Kullanıcının profil resmini büyük boyutta görüntüle')
        .addUserOption(option =>
          option.setName('kullanıcı')
            .setDescription('Resmi görüntülenecek kullanıcı')
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

    if (targetUser.bot) {
      return interaction.reply({
        content: '❌ Bot kullanıcılarının profili görüntülenemez!',
        ephemeral: true
      });
    }

    if (subcommand === 'profil') {
      await handleProfile(interaction, targetUser);
    } else if (subcommand === 'resim') {
      await handleAvatar(interaction, targetUser);
    }
  },
};

async function handleProfile(interaction: ChatInputCommandInteraction, user: User) {
  await interaction.deferReply();

  try {
    // Player verilerini al
    const player = await databaseService.getPlayer(user.id);
    if (!player) {
      await interaction.editReply({
        content: `❌ ${user.username} henüz kayıt olmamış! \`/kayit\` komutu ile kayıt olabilir.`
      });
      return;
    }

    // Daily stats al
    const dailyStats = await dailyStatsService.getDailyStats(user.id);
    const totalStats = await dailyStatsService.getTotalStats(user.id);

    // Quest verilerini al
    let userQuests = await questService.getUserQuests(user.id);
    if (!userQuests) {
      userQuests = await questService.initializeUserQuests(user.id);
    }

    // Voice süresini al (saniye cinsinden)
    const voiceSeconds = await voiceActivityService.getUserVoiceTime(user.id);
    const voiceMinutes = Math.floor(voiceSeconds / 60);
    const voiceHours = Math.floor(voiceMinutes / 60);
    const voiceRemainingMinutes = voiceMinutes % 60;

    // Tamamlanan görev sayısı
    const completedQuests = userQuests.quests.filter(q => q.completed).length;
    const totalQuests = userQuests.quests.length;
    const questProgress = `${completedQuests}/${totalQuests}`;

    // Özel görev durumu
    let specialQuestStatus = '🔒 Kilitli';
    if (userQuests.allDailyCompleted) {
      if (userQuests.specialQuest?.completed) {
        specialQuestStatus = '✅ Tamamlandı';
      } else {
        specialQuestStatus = `🔓 Aktif (${userQuests.specialQuest?.progress || 0}/${userQuests.specialQuest?.target || 0})`;
      }
    }

    // Casino istatistikleri
    const totalCasinoPlays = dailyStats.slotPlays + dailyStats.coinflipPlays + 
                             dailyStats.crashPlays + dailyStats.blackjackPlays + 
                             dailyStats.minesPlays;

    // Sosyal istatistikler
    const totalSocialInteractions = dailyStats.messagesCount + 
                                    dailyStats.reactionsGiven + 
                                    dailyStats.mentionsGiven.size + 
                                    dailyStats.repliesGiven.size;

    // Discord üyelik tarihi
    const memberSince = user.createdAt;
    const daysSinceMember = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24));

    // Profil resmini indir ve büyük boyutta göster
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 1024 });
    
    // Embed oluştur
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`👤 ${user.username} - Kullanıcı Profili`)
      .setThumbnail(avatarUrl)
      .setDescription(
        `**Discord ID:** ${user.id}\n` +
        `**Hesap Oluşturma:** <t:${Math.floor(memberSince.getTime() / 1000)}:R> (${daysSinceMember} gün önce)\n` +
        `**Kayıt Tarihi:** <t:${Math.floor(player.createdAt.getTime() / 1000)}:R>`
      )
      .addFields(
        {
          name: '💰 Ekonomi',
          value: 
            `**Bakiye:** ${player.balance.toLocaleString()} 🪙\n` +
            `**Ses Paketleri:** ${player.voicePackets} 📦`,
          inline: true
        },
        {
          name: '🎤 Ses İstatistikleri',
          value: 
            `**Bugün:** ${dailyStats.voiceMinutes} dakika\n` +
            `**Toplam:** ${voiceHours}s ${voiceRemainingMinutes}d\n` +
            `**Aktif Süre:** ${voiceMinutes} dakika`,
          inline: true
        },
        {
          name: '📋 Görevler',
          value: 
            `**Günlük:** ${questProgress}\n` +
            `**Özel Görev:** ${specialQuestStatus}\n` +
            `**Tamamlanan:** ${completedQuests} görev`,
          inline: true
        },
        {
          name: '🎰 Casino (Bugün)',
          value: 
            `**Slot:** ${dailyStats.slotPlays} oyun\n` +
            `**Blackjack:** ${dailyStats.blackjackPlays} oyun\n` +
            `**Coinflip:** ${dailyStats.coinflipPlays} oyun\n` +
            `**Crash:** ${dailyStats.crashPlays} oyun\n` +
            `**Mines:** ${dailyStats.minesPlays} oyun\n` +
            `**Toplam:** ${totalCasinoPlays} oyun\n` +
            `**Kazanç:** ${dailyStats.casinoWins} 🪙\n` +
            `**Harcama:** ${dailyStats.casinoSpent} 🪙`,
          inline: true
        },
        {
          name: '💬 Sosyal (Bugün)',
          value: 
            `**Mesajlar:** ${dailyStats.messagesCount}\n` +
            `**Reaction Verilen:** ${dailyStats.reactionsGiven}\n` +
            `**Reaction Alınan:** ${dailyStats.reactionsReceived}\n` +
            `**Mention:** ${dailyStats.mentionsGiven.size} kişi\n` +
            `**Reply:** ${dailyStats.repliesGiven.size} kişi\n` +
            `**Emoji Kullanımı:** ${dailyStats.emojisUsed.size} farklı\n` +
            `**Kanal Çeşitliliği:** ${dailyStats.channelsUsed.size} kanal`,
          inline: true
        },
        {
          name: '🎮 Oyun İstatistikleri',
          value: 
            `**LoL IGN:** ${player.lolIgn || 'Ayarlanmamış'}\n` +
            `**TFT IGN:** ${player.tftIgn || 'Ayarlanmamış'}\n` +
            `**LoL Kazanma:** ${player.stats.lol.wins}W ${player.stats.lol.losses}L\n` +
            `**TFT Maçlar:** ${player.stats.tft.matches}\n` +
            `**TFT Top 4:** ${player.stats.tft.top4}\n` +
            `**TFT Puan:** ${player.stats.tft.points}`,
          inline: true
        }
      )
      .setImage(avatarUrl)
      .setFooter({ text: `Profil ID: ${user.id}` })
      .setTimestamp();

    // Aktif saat dilimleri varsa ekle
    if (dailyStats.hourlyActivity.size > 0) {
      const hours = Array.from(dailyStats.hourlyActivity).sort((a, b) => a - b);
      const hourRanges = formatHourRanges(hours);
      embed.addFields({
        name: '⏰ Aktif Saatler (Bugün)',
        value: hourRanges,
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error: any) {
    Logger.error('Profil görüntüleme hatası:', error);
    await interaction.editReply({
      content: `❌ Profil bilgileri alınırken bir hata oluştu: ${error.message}`
    });
  }
}

async function handleAvatar(interaction: ChatInputCommandInteraction, user: User) {
  await interaction.deferReply();

  try {
    // En yüksek çözünürlükte avatar URL'i al
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 4096 });
    
    // Avatar'ı indir
    const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Geçici dosya oluştur
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `avatar_${user.id}_${Date.now()}.png`);
    fs.writeFileSync(tempFilePath, buffer);
    
    // Attachment oluştur
    const attachment = new AttachmentBuilder(tempFilePath, { name: `${user.username}_avatar.png` });
    
    // Embed oluştur
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🖼️ ${user.username} - Profil Resmi`)
      .setDescription(
        `**Kullanıcı:** ${user.tag}\n` +
        `**ID:** ${user.id}\n\n` +
        `[Orijinal Boyutta İndir](${avatarUrl})`
      )
      .setImage(`attachment://${user.username}_avatar.png`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], files: [attachment] });
    
    // Geçici dosyayı sil
    setTimeout(() => {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (err) {
        Logger.error('Geçici dosya silinemedi:', err);
      }
    }, 5000);

  } catch (error: any) {
    Logger.error('Avatar görüntüleme hatası:', error);
    
    // Hata durumunda direkt URL ile dene
    try {
      const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 4096 });
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🖼️ ${user.username} - Profil Resmi`)
        .setDescription(
          `**Kullanıcı:** ${user.tag}\n` +
          `**ID:** ${user.id}\n\n` +
          `[Orijinal Boyutta İndir](${avatarUrl})`
        )
        .setImage(avatarUrl)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (fallbackError) {
      await interaction.editReply({
        content: `❌ Profil resmi görüntülenirken bir hata oluştu: ${error.message}`
      });
    }
  }
}

function formatHourRanges(hours: number[]): string {
  if (hours.length === 0) return 'Veri yok';
  
  const ranges: string[] = [];
  let start = hours[0];
  let end = hours[0];
  
  for (let i = 1; i < hours.length; i++) {
    if (hours[i] === end + 1) {
      end = hours[i];
    } else {
      ranges.push(start === end ? `${start}:00` : `${start}:00-${end}:00`);
      start = hours[i];
      end = hours[i];
    }
  }
  
  ranges.push(start === end ? `${start}:00` : `${start}:00-${end}:00`);
  return ranges.join(', ');
}
