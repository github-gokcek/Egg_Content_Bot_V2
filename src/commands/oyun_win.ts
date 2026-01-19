import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { matchService } from '../services/matchService';
import { configService } from '../services/configService';
import { Team } from '../types';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oyun_win')
    .setDescription('Maç sonucunu gir')
    .addStringOption(option =>
      option.setName('game_id')
        .setDescription('Maç ID')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('kazanan')
        .setDescription('Kazanan takım')
        .setRequired(true)
        .addChoices(
          { name: '🔵 Mavi Takım', value: 'blue' },
          { name: '🔴 Kırmızı Takım', value: 'red' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const gameId = interaction.options.getString('game_id', true);
    const winner = interaction.options.getString('kazanan', true) as Team;
    
    const match = await matchService.getLolMatch(gameId);

    if (!match) {
      return interaction.reply({ content: '❌ Maç bulunamadı!', ephemeral: true });
    }

    if (match.status === 'completed') {
      return interaction.reply({ content: '❌ Bu maç zaten tamamlanmış!', ephemeral: true });
    }

    if (match.status === 'waiting') {
      return interaction.reply({ content: '❌ Bu maç henüz başlamadı!', ephemeral: true });
    }

    // Sadece maçı oluşturan veya admin sonuç girebilir
    const isCreator = match.createdBy === interaction.user.id;
    const isAdmin = interaction.memberPermissions?.has('Administrator');

    if (!isCreator && !isAdmin) {
      return interaction.reply({ content: '❌ Bu maçın sonucunu girme yetkiniz yok!', ephemeral: true });
    }

    // Önce reply yap (timeout olmasın)
    const winnerText = winner === Team.BLUE ? '🔵 Mavi Takım' : '🔴 Kırmızı Takım';
    await interaction.reply({ 
      content: `✅ Maç tamamlandı! Kazanan: **${winnerText}**`,
      ephemeral: false 
    });

    await matchService.completeLolMatch(gameId, winner);

    // Maç kanallarını sil
    if (interaction.guild) {
      const categoryName = `🎮 Maç #${gameId}`;
      const category = interaction.guild.channels.cache.find(c => c.name === categoryName && c.type === 4);
      
      if (category && category.type === 4) {
        try {
          // Kategorideki tüm kanalları sil
          for (const [, channel] of category.children.cache) {
            await channel.delete('Maç tamamlandı');
          }
          // Kategoriyi sil
          await category.delete('Maç tamamlandı');
          Logger.success('Maç kanalları silindi', { gameId });
        } catch (error) {
          Logger.error('Maç kanalları silinirken hata', error);
        }
      }
    }

    // İstatistikleri güncelle
    const { playerStatsService } = await import('../services/playerStatsService');
    await playerStatsService.updateLolStats([], winner, match.blueTeam, match.redTeam);

    // Faction Points ver
    const { factionService } = await import('../services/factionService');
    const { FP_RATES } = await import('../types/faction');
    
    const allPlayers = [...Object.values(match.blueTeam), ...Object.values(match.redTeam)];
    const winnerPlayers = winner === Team.BLUE ? Object.values(match.blueTeam) : Object.values(match.redTeam);
    
    for (const playerId of allPlayers) {
      const isWinner = winnerPlayers.includes(playerId);
      const fpAmount = isWinner ? FP_RATES.MATCH_WIN : FP_RATES.MATCH_COMPLETION;
      await factionService.awardFP(playerId, fpAmount, isWinner ? 'match_win' : 'match_completion', { matchId: gameId });
    }

    // Mesajı güncelle
    if (match.messageId && match.channelId) {
      try {
        const channel = await interaction.client.channels.fetch(match.channelId);
        if (channel?.isTextBased()) {
          const message = await channel.messages.fetch(match.messageId);
          const { EmbedBuilder: MatchEmbedBuilder } = await import('../utils/embedBuilder');
          const embed = MatchEmbedBuilder.createLolMatchEmbed(match);
          await message.edit({ embeds: [embed], components: [] });
        }
      } catch (error) {
        Logger.error('Maç mesajı güncellenemedi', error);
      }
    }

    Logger.success('Maç sonucu girildi', { gameId, winner });
    
    // Sonuç kanalına log at
    if (interaction.guildId) {
      const logChannelId = await configService.getWinnerLogChannel(interaction.guildId, 'lol');
      if (logChannelId) {
        try {
          const logChannel = await interaction.client.channels.fetch(logChannelId);
          if (logChannel?.isTextBased()) {
            const winnerTeam = winner === Team.BLUE ? match.blueTeam : match.redTeam;
            const loserTeam = winner === Team.BLUE ? match.redTeam : match.blueTeam;
            
            const resultEmbed = new EmbedBuilder()
              .setColor(winner === Team.BLUE ? 0x3498db : 0xe74c3c)
              .setTitle('🏆 Maç Tamamlandı')
              .setDescription(`**Maç ID:** \`${match.id}\``)
              .addFields(
                { 
                  name: `${winnerText} (Kazanan)`, 
                  value: Object.values(winnerTeam).map(p => `<@${p}>`).join(', ') || '*Yok*',
                  inline: false 
                },
                { 
                  name: winner === Team.BLUE ? '🔴 Kırmızı Takım' : '🔵 Mavi Takım', 
                  value: Object.values(loserTeam).map(p => `<@${p}>`).join(', ') || '*Yok*',
                  inline: false 
                }
              )
              .setTimestamp();

            await (logChannel as any).send({ embeds: [resultEmbed] });
          }
        } catch (error) {
          Logger.error('Sonuç kanalına log atılamadı', error);
        }
      }
    }
  },
};
