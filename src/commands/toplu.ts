import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { Logger } from '../utils/logger';
import { Player } from '../types';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toplu')
    .setDescription('Sunucudaki tüm üyelere coin ekle veya çıkar')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('İşlem türü')
        .setRequired(true)
        .addChoices(
          { name: '➕ Ekle', value: 'add' },
          { name: '➖ Çıkar', value: 'remove' }
        )
    )
    .addIntegerOption(opt =>
      opt.setName('miktar')
        .setDescription('Coin miktarı')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const mode = interaction.options.getString('mode', true) as 'add' | 'remove';
      const amount = interaction.options.getInteger('miktar', true);
      const guild = interaction.guild;

      if (!guild) {
        return interaction.editReply('❌ Sunucu bulunamadı!');
      }

      // Tüm üyeleri getir
      const members = await guild.members.fetch();
      
      let processedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Her üyeyi işle
      for (const [, member] of members) {
        // Botları atla
        if (member.user.bot) {
          skippedCount++;
          continue;
        }

        try {
          // Oyuncuyu getir
          let player = await databaseService.getPlayer(member.id);
          
          if (!player) {
            // Oyuncu yoksa oluştur
            player = {
              discordId: member.id,
              username: member.user.username,
              balance: 0,
              createdAt: new Date(),
              stats: {
                lol: { wins: 0, losses: 0 },
                tft: { matches: 0, top4: 0, rankings: [], points: 0 }
              }
            };
          }

          // Coin işlemi
          if (mode === 'add') {
            player.balance += amount;
          } else {
            // Çıkarma modunda bakiye kontrolü
            if (player.balance < amount) {
              skippedCount++;
              errors.push(`${member.user.username}: Yetersiz bakiye (${player.balance} 🪙)`);
              continue;
            }
            player.balance -= amount;
          }

          await databaseService.updatePlayer(player);
          processedCount++;
          Logger.success('Toplu coin işlemi', { userId: member.id, username: member.user.username, mode, amount });
        } catch (error) {
          errors.push(`${member.user.username}: ${error}`);
          Logger.error('Toplu coin işlemi hatası', error);
        }
      }

      // Sonuç embed'i
      const modeText = mode === 'add' ? '➕ Eklendi' : '➖ Çıkarıldı';
      const embed = new EmbedBuilder()
        .setColor(mode === 'add' ? 0x00ff00 : 0xff0000)
        .setTitle(`${modeText} - Toplu Coin İşlemi`)
        .addFields(
          { name: '💰 İşlem Miktarı', value: `${amount} 🪙`, inline: true },
          { name: '✅ İşlenen Üye', value: `${processedCount} üye`, inline: true },
          { name: '⏭️ Atlanan Üye', value: `${skippedCount} üye`, inline: true },
          { name: '👥 Toplam İşlenen', value: `${processedCount + skippedCount} üye`, inline: true }
        )
        .setTimestamp();

      if (errors.length > 0) {
        embed.addFields({
          name: '⚠️ Hatalar/Atlanmış',
          value: errors.slice(0, 10).join('\n') + (errors.length > 10 ? `\n... ve ${errors.length - 10} hata daha` : '')
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error('Toplu coin işlemi hatası', error);
      await interaction.editReply('❌ Toplu coin işlemi sırasında bir hata oluştu!');
    }
  }
};
