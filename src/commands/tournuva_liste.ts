import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getAllTournaments } from './turnuva';
import { createTournamentEmbed } from './turnuva';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tournuva_liste')
    .setDescription('Aktif turnuvaları listele')
    .addStringOption(option =>
      option
        .setName('turnuva_id')
        .setDescription('Belirli bir turnuvanın detaylarını görmek için')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const tournamentId = interaction.options.getString('turnuva_id');

      // Belirli turnuvayı göster
      if (tournamentId) {
        const tournaments = getAllTournaments();
        const tournament = tournaments.get(tournamentId);

        if (!tournament) {
          return await interaction.reply({
            content: '❌ Turnuva bulunamadı!',
            ephemeral: true,
          });
        }

        const embed = createTournamentEmbed(tournament.bracket, tournamentId);
        return await interaction.reply({ embeds: [embed] });
      }

      // Tüm aktif turnuvaları listele
      const tournaments = getAllTournaments();

      if (tournaments.size === 0) {
        return await interaction.reply({
          content: '❌ Aktif turnuva yok!',
          ephemeral: true,
        });
      }

      const embeds: EmbedBuilder[] = [];

      tournaments.forEach((tournament, id) => {
        const embed = new EmbedBuilder()
          .setTitle(`📋 Turnuva: ${id}`)
          .setColor(0x2f3136)
          .addFields(
            {
              name: '👥 Oyuncu Sayısı',
              value: `${tournament.bracket.totalPlayers}`,
              inline: true,
            },
            {
              name: '📊 Durumu',
              value: `${tournament.bracket.status}`,
              inline: true,
            },
            {
              name: '🆔 Komut İçin',
              value: `\`/tournuva_liste ${id}\``,
              inline: false,
            }
          );

        embeds.push(embed);
      });

      await interaction.reply({ embeds });

      Logger.info(`Turnuva listesi görüntülendi (${tournaments.size} aktif)`);
    } catch (error: any) {
      Logger.error('Turnuva liste komut hatası:', error);
      await interaction.reply({
        content: `❌ ${error.message || 'Bir hata oluştu!'}`,
        ephemeral: true,
      });
    }
  },
};
