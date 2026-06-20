import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { updateMatchResult, getTournamentStats } from '../../turnuva';
import { getTournamentById, updateTournament, createTournamentEmbed } from './turnuva';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sonuc')
    .setDescription('Turnuva maçının sonucunu güncelle')
    .addStringOption(option =>
      option
        .setName('turnuva_id')
        .setDescription('Turnuva ID')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('mac_id')
        .setDescription('Maç ID (ör: winners-1-1, losers-2-3)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('kazanan_id')
        .setDescription('Kazanan oyuncunun ID (ör: player-1)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const tournamentId = interaction.options.getString('turnuva_id', true);
      const matchId = interaction.options.getString('mac_id', true);
      const winnerId = interaction.options.getString('kazanan_id', true);

      const tournament = getTournamentById(tournamentId);
      if (!tournament) {
        return await interaction.reply({
          content: '❌ Turnuva bulunamadı!',
          ephemeral: true,
        });
      }

      // Kazananı bul
      const winner = tournament.bracket.players.find(p => p.id === winnerId);
      if (!winner) {
        return await interaction.reply({
          content: '❌ Oyuncu bulunamadı!',
          ephemeral: true,
        });
      }

      // Maç sonucunu güncelle
      updateMatchResult(tournament.bracket, matchId, winner);
      updateTournament(tournamentId, tournament.bracket);

      // Güncellenmiş bracket'i göster
      const embed = createTournamentEmbed(tournament.bracket, tournamentId);
      await interaction.reply({ embeds: [embed] });

      Logger.info(`Maç güncellendi: ${tournamentId} - ${matchId} → ${winner.name}`);
    } catch (error: any) {
      Logger.error('Sonuç komut hatası:', error);
      await interaction.reply({
        content: `❌ ${error.message || 'Bir hata oluştu!'}`,
        ephemeral: true,
      });
    }
  },
};
