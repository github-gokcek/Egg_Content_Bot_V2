import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { matchService } from '../services/matchService';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oyun_iptal')
    .setDescription('Bir maçı iptal et')
    .addStringOption(option =>
      option.setName('game_id')
        .setDescription('Maç ID')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const gameId = interaction.options.getString('game_id', true);
    
    // LoL veya TFT maçı olabilir
    let match = await matchService.getLolMatch(gameId);
    let isTft = false;
    
    if (!match) {
      match = await matchService.getTftMatch(gameId) as any;
      isTft = true;
    }

    if (!match) {
      return interaction.reply({ content: '❌ Maç bulunamadı!', ephemeral: true });
    }

    // Sadece maçı oluşturan veya admin iptal edebilir
    const isCreator = match.createdBy === interaction.user.id;
    const isAdmin = interaction.memberPermissions?.has('Administrator');

    if (!isCreator && !isAdmin) {
      return interaction.reply({ content: '❌ Bu maçı iptal etme yetkiniz yok!', ephemeral: true });
    }

    if (isTft) {
      await matchService.deleteTftMatch(gameId);
    } else {
      await matchService.deleteLolMatch(gameId);
    }
    
    // Mesajı sil
    if (match.messageId && match.channelId) {
      try {
        const channel = await interaction.client.channels.fetch(match.channelId);
        if (channel?.isTextBased()) {
          const message = await channel.messages.fetch(match.messageId);
          await message.delete();
        }
      } catch (error) {
        Logger.error('Maç mesajı silinemedi', error);
      }
    }

    Logger.success('Maç iptal edildi', { gameId, by: interaction.user.id, type: isTft ? 'TFT' : 'LoL' });
    await interaction.reply({ content: '✅ Maç iptal edildi!', ephemeral: true });
  },
};
