import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { Player } from '../types';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayit')
    .setDescription('Oyuncu kaydı yap')
    .addStringOption(opt => 
      opt.setName('lol_ign')
        .setDescription('League of Legends oyun içi adınız')
        .setRequired(false)
    )
    .addStringOption(opt => 
      opt.setName('tft_ign')
        .setDescription('TFT oyun içi adınız (farklıysa)')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const lolIgn = interaction.options.getString('lol_ign');
    const tftIgn = interaction.options.getString('tft_ign');

    if (!lolIgn && !tftIgn) {
      return interaction.reply({ 
        content: '❌ En az bir oyun için IGN girmelisiniz!', 
        ephemeral: true 
      });
    }

    try {
      // Mevcut oyuncuyu kontrol et
      let player = await databaseService.getPlayer(interaction.user.id);
      
      if (!player) {
        // Yeni oyuncu oluştur
        player = {
          discordId: interaction.user.id,
          username: interaction.user.username,
          lolIgn: lolIgn || undefined,
          tftIgn: tftIgn || undefined,
          balance: 100, // Başlangıç bakiyesi
          createdAt: new Date(),
          stats: {
            lol: {
              wins: 0,
              losses: 0
            },
            tft: {
              matches: 0,
              top4: 0,
              rankings: [],
              points: 0
            }
          }
        };
      } else {
        // Mevcut oyuncuyu güncelle
        if (lolIgn) player.lolIgn = lolIgn;
        if (tftIgn) player.tftIgn = tftIgn;
      }

      await databaseService.savePlayer(player);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Kayıt Tamamlandı!')
        .setDescription(`<@${interaction.user.id}> başarıyla kaydedildi!`)
        .addFields(
          { name: '🎮 Discord', value: interaction.user.username, inline: true },
          { name: '⚔️ LoL IGN', value: lolIgn || '*Belirtilmedi*', inline: true },
          { name: '♟️ TFT IGN', value: tftIgn || lolIgn || '*Belirtilmedi*', inline: true },
          { name: '💰 Başlangıç Bakiyesi', value: '100 🪙', inline: false }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      Logger.success('Oyuncu kaydedildi', { 
        discordId: interaction.user.id, 
        lolIgn, 
        tftIgn 
      });

    } catch (error) {
      Logger.error('Oyuncu kaydedilemedi', error);
      await interaction.reply({ 
        content: '❌ Kayıt sırasında hata oluştu!', 
        ephemeral: true 
      });
    }
  },
};