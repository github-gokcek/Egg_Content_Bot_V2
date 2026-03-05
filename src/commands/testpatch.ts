import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { patchNotesService } from '../services/patchNotesService';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testpatch')
    .setDescription('Son patch notlarını manuel olarak getir (test için)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('oyun')
        .setDescription('Hangi oyunun patch notlarını getirmek istiyorsun?')
        .setRequired(true)
        .addChoices(
          { name: 'League of Legends', value: 'lol' },
          { name: 'Teamfight Tactics', value: 'tft' },
          { name: 'Her İkisi', value: 'both' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const game = interaction.options.getString('oyun', true);
    const config = await patchNotesService.getPatchConfig(interaction.guildId!);

    if (!config || !config.channelId) {
      return interaction.editReply({ 
        content: '❌ Patch kanalı ayarlanmamış! Önce `/setpatch` komutunu kullanın.' 
      });
    }

    const channel = await interaction.guild?.channels.fetch(config.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return interaction.editReply({ 
        content: '❌ Patch kanalı bulunamadı veya metin kanalı değil!' 
      });
    }

    try {
      let sentCount = 0;

      if (game === 'lol' || game === 'both') {
        const lolPatch = await patchNotesService.fetchLatestPatch('lol');
        if (lolPatch) {
          const lolRole = interaction.guild?.roles.cache.find(r => r.name.toLowerCase() === 'lol');
          const mention = lolRole ? `<@&${lolRole.id}>` : '@LoL';
          
          const { EmbedBuilder } = await import('discord.js');
          const embed = new EmbedBuilder()
            .setColor(0x0397AB)
            .setTitle(lolPatch.title)
            .setURL(lolPatch.link)
            .setDescription(`🔗 [Patch Notlarını Oku](${lolPatch.link})`)
            .setTimestamp();

          if (lolPatch.image) {
            embed.setImage(lolPatch.image);
          }

          await channel.send({
            content: `${mention} **Yeni League of Legends Patch Notları!**`,
            embeds: [embed]
          });

          await patchNotesService.updateLastPatch(interaction.guildId!, 'lol', lolPatch.title);
          sentCount++;
          Logger.success('LoL patch manuel paylaşıldı', { guildId: interaction.guildId, patch: lolPatch.title });
        }
      }

      if (game === 'tft' || game === 'both') {
        const tftPatch = await patchNotesService.fetchLatestPatch('tft');
        if (tftPatch) {
          const tftRole = interaction.guild?.roles.cache.find(r => r.name.toLowerCase() === 'tft');
          const mention = tftRole ? `<@&${tftRole.id}>` : '@TFT';
          
          const { EmbedBuilder } = await import('discord.js');
          const embed = new EmbedBuilder()
            .setColor(0xE4A93C)
            .setTitle(tftPatch.title)
            .setURL(tftPatch.link)
            .setDescription(`🔗 [Patch Notlarını Oku](${tftPatch.link})`)
            .setTimestamp();

          if (tftPatch.image) {
            embed.setImage(tftPatch.image);
          }

          await channel.send({
            content: `${mention} **Yeni Teamfight Tactics Patch Notları!**`,
            embeds: [embed]
          });

          await patchNotesService.updateLastPatch(interaction.guildId!, 'tft', tftPatch.title);
          sentCount++;
          Logger.success('TFT patch manuel paylaşıldı', { guildId: interaction.guildId, patch: tftPatch.title });
        }
      }

      if (sentCount > 0) {
        await interaction.editReply({ 
          content: `✅ ${sentCount} patch notu ${channel} kanalında paylaşıldı!` 
        });
      } else {
        await interaction.editReply({ 
          content: '❌ Patch notları getirilemedi. RSS feed\'e erişim sorunu olabilir.' 
        });
      }

    } catch (error) {
      Logger.error('Test patch hatası', error);
      await interaction.editReply({ 
        content: '❌ Patch notları getirilirken hata oluştu!' 
      });
    }
  },
};
