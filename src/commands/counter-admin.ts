import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { counterAnalysisService } from '../services/counterAnalysisService';
import { Logger } from '../utils/logger';

// Admin kullanıcı ID'leri (kendi Discord ID'nizi buraya ekleyin)
const ADMIN_IDS = ['YOUR_DISCORD_ID']; // Örnek: ['123456789012345678']

module.exports = {
  data: new SlashCommandBuilder()
    .setName('counter-admin')
    .setDescription('Counter veritabanı yönetimi (Sadece Admin)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('analyze-player')
        .setDescription('Bir oyuncunun maçlarını analiz et')
        .addStringOption(option =>
          option
            .setName('riot-id')
            .setDescription('Oyuncu Riot ID (Örnek: Elma#TR1)')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('match-count')
            .setDescription('Analiz edilecek maç sayısı (varsayılan: 20)')
            .setMinValue(5)
            .setMaxValue(100)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('analyze-multiple')
        .setDescription('Birden fazla oyuncuyu analiz et')
        .addStringOption(option =>
          option
            .setName('riot-ids')
            .setDescription('Oyuncu Riot ID\'leri (virgülle ayırın: Elma#TR1, Armut#TR1)')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('match-count')
            .setDescription('Her oyuncu için maç sayısı (varsayılan: 20)')
            .setMinValue(5)
            .setMaxValue(50)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Veritabanı istatistiklerini göster')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('get-counters')
        .setDescription('Bir şampiyonun counter\'larını göster')
        .addStringOption(option =>
          option
            .setName('champion')
            .setDescription('Şampiyon adı')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    // Admin kontrolü
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({
        content: '❌ Bu komutu kullanma yetkiniz yok!',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'analyze-player') {
        await interaction.deferReply();

        const riotId = interaction.options.getString('riot-id', true);
        const matchCount = interaction.options.getInteger('match-count') || 20;

        await interaction.editReply(`🔄 **${riotId}** analiz ediliyor... (${matchCount} maç)`);

        const matchupsAnalyzed = await counterAnalysisService.analyzePlayerMatches(riotId, matchCount);

        await interaction.editReply(
          `✅ **Analiz Tamamlandı!**\n` +
          `👤 Oyuncu: ${riotId}\n` +
          `📊 Analiz edilen matchup: ${matchupsAnalyzed}\n` +
          `💾 Veritabanı güncellendi!`
        );

      } else if (subcommand === 'analyze-multiple') {
        await interaction.deferReply();

        const riotIdsStr = interaction.options.getString('riot-ids', true);
        const riotIds = riotIdsStr.split(',').map(id => id.trim());
        const matchCount = interaction.options.getInteger('match-count') || 20;

        await interaction.editReply(
          `🔄 **${riotIds.length} oyuncu analiz ediliyor...**\n` +
          `Bu işlem birkaç dakika sürebilir...`
        );

        const totalMatches = await counterAnalysisService.analyzeMultiplePlayers(riotIds, matchCount);

        await interaction.editReply(
          `✅ **Toplu Analiz Tamamlandı!**\n` +
          `👥 Oyuncu sayısı: ${riotIds.length}\n` +
          `📊 Toplam matchup: ${totalMatches}\n` +
          `💾 Veritabanı güncellendi!`
        );

      } else if (subcommand === 'stats') {
        const stats = counterAnalysisService.getStats();

        await interaction.reply({
          content:
            `📊 **Counter Veritabanı İstatistikleri**\n\n` +
            `🎮 Toplam Şampiyon: **${stats.totalChampions}**\n` +
            `⚔️ Toplam Matchup: **${stats.totalMatchups}**\n\n` +
            `📋 Şampiyonlar:\n${stats.champions.slice(0, 20).join(', ')}${stats.champions.length > 20 ? '...' : ''}`,
          ephemeral: true
        });

      } else if (subcommand === 'get-counters') {
        const champion = interaction.options.getString('champion', true);
        const data = counterAnalysisService.getCounters(champion);

        if (!data) {
          return interaction.reply({
            content: `❌ **${champion}** için counter verisi bulunamadı!`,
            ephemeral: true
          });
        }

        const counterList = data.counters
          .slice(0, 10)
          .map((c, i) => `${i + 1}. **${c.name}** - ${(c.winRate * 100).toFixed(2)}% WR (${c.games} maç)`)
          .join('\n');

        await interaction.reply({
          content:
            `🎯 **${champion} Counter'ları**\n` +
            `📅 Son güncelleme: ${data.lastUpdated}\n\n` +
            `${counterList}`,
          ephemeral: true
        });
      }

    } catch (error: any) {
      Logger.error('[Counter Admin] Hata:', error);
      const errorMessage = error.message || 'Bilinmeyen bir hata oluştu!';
      
      if (interaction.deferred) {
        await interaction.editReply(`❌ **Hata:** ${errorMessage}`);
      } else {
        await interaction.reply({
          content: `❌ **Hata:** ${errorMessage}`,
          ephemeral: true
        });
      }
    }
  }
};
