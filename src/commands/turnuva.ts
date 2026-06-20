import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  createTournamentBracket,
  updateMatchResult,
  getTournamentStats,
  TournamentBracket,
  Player,
  Match,
} from '../../turnuva';
import { Logger } from '../utils/logger';

// Turnuvalar hafızada saklanacak (production'da database kullanılmalı)
const activeTournaments = new Map<string, { bracket: TournamentBracket; guildId: string }>();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('turnuva')
    .setDescription('Double Elimination Turnuvası başlat')
    .addIntegerOption(option =>
      option
        .setName('oyuncu_sayisi')
        .setDescription('Turnuvadaki oyuncu sayısı')
        .setRequired(true)
        .addChoices(
          { name: '4 Oyuncu', value: 4 },
          { name: '8 Oyuncu', value: 8 },
          { name: '12 Oyuncu', value: 12 },
          { name: '16 Oyuncu', value: 16 },
          { name: '20 Oyuncu', value: 20 },
          { name: '24 Oyuncu', value: 24 },
          { name: '28 Oyuncu', value: 28 },
          { name: '32 Oyuncu', value: 32 }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const playerCount = interaction.options.getInteger('oyuncu_sayisi', true);
      const tournamentId = `tournament-${interaction.guildId}-${Date.now()}`;

      // Placeholder oyuncuları oluştur
      const players: Player[] = [];
      for (let i = 1; i <= playerCount; i++) {
        players.push({
          id: `player-${i}`,
          name: `${i}. Takım`,
        });
      }

      // Turnuvayı oluştur
      const bracket = createTournamentBracket(players);
      activeTournaments.set(tournamentId, {
        bracket,
        guildId: interaction.guildId || '',
      });

      // İlk bracket chartını göster
      const embed = createTournamentEmbed(bracket, tournamentId);
      await interaction.reply({ embeds: [embed] });

      Logger.info(`Turnuva başlatıldı: ${tournamentId} (${playerCount} oyuncu)`);
    } catch (error: any) {
      Logger.error('Turnuva komut hatası:', error);
      await interaction.reply({
        content: `❌ ${error.message || 'Bir hata oluştu!'}`,
        ephemeral: true,
      });
    }
  },
};

export function createTournamentEmbed(bracket: TournamentBracket, tournamentId: string): EmbedBuilder {
  const stats = getTournamentStats(bracket);
  const chart = generateBracketChart(bracket);

  const embed = new EmbedBuilder()
    .setTitle('🏆 Double Elimination Turnuvası')
    .setColor(0x2f3136)
    .addFields(
      {
        name: '📊 Turnuva Durumu',
        value: `**Aşama:** ${stats.stage}\n**Tamamlanan:** ${stats.completedMatches}/${stats.totalMatches}\n**Kalan:** ${stats.remainingMatches}`,
        inline: false,
      },
      {
        name: '📋 Bracket',
        value: `\`\`\`\n${chart}\n\`\`\``,
        inline: false,
      }
    )
    .setFooter({
      text: `Tournament ID: ${tournamentId}`,
    })
    .setTimestamp();

  if (bracket.winner) {
    embed.addFields({
      name: '🎉 Şampiyon',
      value: `**${bracket.winner.name}**`,
      inline: false,
    });
  }

  return embed;
}

function generateBracketChart(bracket: TournamentBracket): string {
  const lines: string[] = [];

  // Winners bracket - left to right
  lines.push('👑 WINNERS BRACKET (Soldan Sağa) 👑');
  lines.push('');

  const winnerRounds = bracket.winnersBracket;
  const winnerVisualLines = createBracketVisualization(winnerRounds, 'winners');
  lines.push(...winnerVisualLines);

  lines.push('');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');

  // Losers bracket - left to right
  lines.push('💀 LOSERS BRACKET (Soldan Sağa) 💀');
  lines.push('');

  const loserRounds = bracket.losersBracket;
  const loserVisualLines = createBracketVisualization(loserRounds, 'losers');
  lines.push(...loserVisualLines);

  // Final
  if (bracket.finalMatch) {
    lines.push('');
    lines.push('═══════════════════════════════════════════════════');
    lines.push('');
    lines.push('🥇 GRAND FINAL (Final Maçı) 🥇');
    lines.push('');
    lines.push(formatFinalMatch(bracket.finalMatch));
  }

  return lines.join('\n');
}

function createBracketVisualization(rounds: Match[][], bracketType: string): string[] {
  const lines: string[] = [];

  for (let roundIdx = 0; roundIdx < rounds.length; roundIdx++) {
    const round = rounds[roundIdx];
    lines.push(`Round ${roundIdx + 1}${roundIdx === rounds.length - 1 ? ' (Final)' : ''}:`);

    for (let matchIdx = 0; matchIdx < round.length; matchIdx++) {
      const match = round[matchIdx];
      const player1 = match.player1?.name || 'TBD';
      const player2 = match.player2?.name || 'BYE';

      const p1Status = match.winner?.id === match.player1?.id ? '✅' : '  ';
      const p2Status = match.winner?.id === match.player2?.id ? '✅' : '  ';

      lines.push(
        `  ├─ [${match.id}]`
      );
      lines.push(
        `  │  ${p1Status} ${truncate(player1, 18)}`
      );
      lines.push(
        `  │  ${p2Status} ${truncate(player2, 18)}`
      );

      if (matchIdx < round.length - 1) {
        lines.push(`  │`);
      }
    }

    if (roundIdx < rounds.length - 1) {
      lines.push(`  │`);
      lines.push(``);
    }
  }

  return lines;
}

function formatFinalMatch(match: Match): string {
  const p1 = match.player1?.name || 'TBD';
  const p2 = match.player2?.name || 'TBD';
  const p1Status = match.winner?.id === match.player1?.id ? '✅ ŞAMPIYON' : '❌';
  const p2Status = match.winner?.id === match.player2?.id ? '✅ ŞAMPIYON' : '❌';

  const lines = [
    `${truncate(p1, 25).padEnd(30)} ${p1Status}`,
    `${' '.repeat(30)} vs`,
    `${truncate(p2, 25).padEnd(30)} ${p2Status}`,
  ];

  return lines.join('\n');
}

function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length - 2) + '..' : str;
}

export function getTournamentById(
  tournamentId: string
): { bracket: TournamentBracket; guildId: string } | undefined {
  return activeTournaments.get(tournamentId);
}

export function updateTournament(
  tournamentId: string,
  newBracket: TournamentBracket
): void {
  const tournament = activeTournaments.get(tournamentId);
  if (tournament) {
    tournament.bracket = newBracket;
  }
}

export function getAllTournaments(): Map<string, { bracket: TournamentBracket; guildId: string }> {
  return activeTournaments;
}
