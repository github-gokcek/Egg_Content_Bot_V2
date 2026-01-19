"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const matchService_1 = require("../services/matchService");
const configService_1 = require("../services/configService");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('oyun_win')
        .setDescription('Maç sonucunu gir')
        .addStringOption(option => option.setName('game_id')
        .setDescription('Maç ID')
        .setRequired(true))
        .addStringOption(option => option.setName('kazanan')
        .setDescription('Kazanan takım')
        .setRequired(true)
        .addChoices({ name: '🔵 Mavi Takım', value: 'blue' }, { name: '🔴 Kırmızı Takım', value: 'red' })),
    async execute(interaction) {
        const gameId = interaction.options.getString('game_id', true);
        const winner = interaction.options.getString('kazanan', true);
        const match = await matchService_1.matchService.getLolMatch(gameId);
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
        const winnerText = winner === types_1.Team.BLUE ? '🔵 Mavi Takım' : '🔴 Kırmızı Takım';
        await interaction.reply({
            content: `✅ Maç tamamlandı! Kazanan: **${winnerText}**`,
            ephemeral: false
        });
        await matchService_1.matchService.completeLolMatch(gameId, winner);
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
                    logger_1.Logger.success('Maç kanalları silindi', { gameId });
                }
                catch (error) {
                    logger_1.Logger.error('Maç kanalları silinirken hata', error);
                }
            }
        }
        // İstatistikleri güncelle
        const { playerStatsService } = await Promise.resolve().then(() => __importStar(require('../services/playerStatsService')));
        await playerStatsService.updateLolStats([], winner, match.blueTeam, match.redTeam);
        // Faction Points ver
        const { factionService } = await Promise.resolve().then(() => __importStar(require('../services/factionService')));
        const { FP_RATES } = await Promise.resolve().then(() => __importStar(require('../types/faction')));
        const allPlayers = [...Object.values(match.blueTeam), ...Object.values(match.redTeam)];
        const winnerPlayers = winner === types_1.Team.BLUE ? Object.values(match.blueTeam) : Object.values(match.redTeam);
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
                    const { EmbedBuilder: MatchEmbedBuilder } = await Promise.resolve().then(() => __importStar(require('../utils/embedBuilder')));
                    const embed = MatchEmbedBuilder.createLolMatchEmbed(match);
                    await message.edit({ embeds: [embed], components: [] });
                }
            }
            catch (error) {
                logger_1.Logger.error('Maç mesajı güncellenemedi', error);
            }
        }
        logger_1.Logger.success('Maç sonucu girildi', { gameId, winner });
        // Sonuç kanalına log at
        if (interaction.guildId) {
            const logChannelId = await configService_1.configService.getWinnerLogChannel(interaction.guildId, 'lol');
            if (logChannelId) {
                try {
                    const logChannel = await interaction.client.channels.fetch(logChannelId);
                    if (logChannel?.isTextBased()) {
                        const winnerTeam = winner === types_1.Team.BLUE ? match.blueTeam : match.redTeam;
                        const loserTeam = winner === types_1.Team.BLUE ? match.redTeam : match.blueTeam;
                        const resultEmbed = new discord_js_1.EmbedBuilder()
                            .setColor(winner === types_1.Team.BLUE ? 0x3498db : 0xe74c3c)
                            .setTitle('🏆 Maç Tamamlandı')
                            .setDescription(`**Maç ID:** \`${match.id}\``)
                            .addFields({
                            name: `${winnerText} (Kazanan)`,
                            value: Object.values(winnerTeam).map(p => `<@${p}>`).join(', ') || '*Yok*',
                            inline: false
                        }, {
                            name: winner === types_1.Team.BLUE ? '🔴 Kırmızı Takım' : '🔵 Mavi Takım',
                            value: Object.values(loserTeam).map(p => `<@${p}>`).join(', ') || '*Yok*',
                            inline: false
                        })
                            .setTimestamp();
                        await logChannel.send({ embeds: [resultEmbed] });
                    }
                }
                catch (error) {
                    logger_1.Logger.error('Sonuç kanalına log atılamadı', error);
                }
            }
        }
    },
};
