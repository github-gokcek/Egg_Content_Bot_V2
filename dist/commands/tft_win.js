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
const groupService_1 = require("../services/groupService");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('tft_win')
        .setDescription('TFT maç sonucunu gir (sıralama)')
        .addStringOption(opt => opt.setName('game_id').setDescription('Maç ID').setRequired(true))
        .addUserOption(opt => opt.setName('birinci').setDescription('1. olan oyuncu/grup').setRequired(true))
        .addUserOption(opt => opt.setName('ikinci').setDescription('2. olan oyuncu/grup').setRequired(true))
        .addUserOption(opt => opt.setName('ucuncu').setDescription('3. olan oyuncu/grup').setRequired(true))
        .addUserOption(opt => opt.setName('dorduncu').setDescription('4. olan oyuncu/grup').setRequired(true))
        .addUserOption(opt => opt.setName('besinci').setDescription('5. olan oyuncu/grup').setRequired(false))
        .addUserOption(opt => opt.setName('altinci').setDescription('6. olan oyuncu/grup').setRequired(false))
        .addUserOption(opt => opt.setName('yedinci').setDescription('7. olan oyuncu/grup').setRequired(false))
        .addUserOption(opt => opt.setName('sekizinci').setDescription('8. olan oyuncu/grup').setRequired(false)),
    async execute(interaction) {
        const gameId = interaction.options.getString('game_id', true);
        const match = await matchService_1.matchService.getTftMatch(gameId);
        if (!match) {
            return interaction.reply({ content: '❌ Maç bulunamadı!', ephemeral: true });
        }
        if (match.status !== 'active') {
            return interaction.reply({ content: '❌ Bu maç aktif değil!', ephemeral: true });
        }
        const isCreator = match.createdBy === interaction.user.id;
        const isAdmin = interaction.memberPermissions?.has('Administrator');
        if (!isCreator && !isAdmin) {
            return interaction.reply({ content: '❌ Bu maçın sonucunu girme yetkiniz yok!', ephemeral: true });
        }
        const rankings = [];
        if (match.mode === types_1.TftMode.DOUBLE) {
            // Double Up - 4 takım
            for (let i = 1; i <= 4; i++) {
                const user = interaction.options.getUser(i === 1 ? 'birinci' : i === 2 ? 'ikinci' : i === 3 ? 'ucuncu' : 'dorduncu', true);
                rankings.push(user.id);
            }
        }
        else {
            // Solo - 8 oyuncu
            const positions = ['birinci', 'ikinci', 'ucuncu', 'dorduncu', 'besinci', 'altinci', 'yedinci', 'sekizinci'];
            for (const pos of positions) {
                const user = interaction.options.getUser(pos);
                if (user)
                    rankings.push(user.id);
            }
            if (rankings.length < 4) {
                return interaction.reply({ content: '❌ En az 4 oyuncu girilmeli!', ephemeral: true });
            }
        }
        await matchService_1.matchService.completeTftMatch(gameId, rankings);
        // İstatistikleri güncelle (sadece Solo için)
        if (match.mode === types_1.TftMode.SOLO) {
            const { playerStatsService } = await Promise.resolve().then(() => __importStar(require('../services/playerStatsService')));
            await playerStatsService.updateTftStats(rankings);
        }
        // Mesajı güncelle
        if (match.messageId && match.channelId) {
            try {
                const channel = await interaction.client.channels.fetch(match.channelId);
                if (channel?.isTextBased()) {
                    const message = await channel.messages.fetch(match.messageId);
                    const { EmbedBuilder: MatchEmbedBuilder } = await Promise.resolve().then(() => __importStar(require('../utils/embedBuilder')));
                    const embed = MatchEmbedBuilder.createTftMatchEmbed(match);
                    await message.edit({ embeds: [embed], components: [] });
                }
            }
            catch (error) {
                logger_1.Logger.error('Maç mesajı güncellenemedi', error);
            }
        }
        // Sonuç kanalına log
        if (interaction.guildId) {
            const logChannelId = await configService_1.configService.getWinnerLogChannel(interaction.guildId, 'tft');
            if (logChannelId) {
                try {
                    const logChannel = await interaction.client.channels.fetch(logChannelId);
                    if (logChannel?.isTextBased()) {
                        const resultEmbed = new discord_js_1.EmbedBuilder()
                            .setColor(0xe67e22)
                            .setTitle(`♟️ TFT ${match.mode === types_1.TftMode.DOUBLE ? 'Double Up' : 'Solo'} Maç Tamamlandı`)
                            .setDescription(`**Maç ID:** \`${match.id}\``);
                        if (match.mode === types_1.TftMode.DOUBLE) {
                            // Double Up - Grup isimleri göster
                            const fields = rankings.map((userId, index) => {
                                const group = groupService_1.groupService.getUserGroup(userId);
                                const points = [3, 1, -1, -3][index];
                                const groupText = group ? `**${group.name}** (${group.members.map(m => `<@${m}>`).join(', ')})` : `<@${userId}>`;
                                return {
                                    name: `${index + 1}. Sıra`,
                                    value: `${groupText} (${points > 0 ? '+' : ''}${points} puan)`,
                                    inline: false
                                };
                            });
                            resultEmbed.addFields(fields);
                        }
                        else {
                            // Solo
                            const fields = rankings.map((playerId, index) => {
                                const points = matchService_1.matchService.getTftPointsForRank(index + 1);
                                return {
                                    name: `${index + 1}. Sıra`,
                                    value: `<@${playerId}> (${points > 0 ? '+' : ''}${points} puan)`,
                                    inline: true
                                };
                            });
                            resultEmbed.addFields(fields);
                        }
                        resultEmbed.setTimestamp();
                        await logChannel.send({ embeds: [resultEmbed] });
                    }
                }
                catch (error) {
                    logger_1.Logger.error('Sonuç kanalına log atılamadı', error);
                }
            }
        }
        logger_1.Logger.success('TFT maç sonucu girildi', { gameId, rankings });
        await interaction.reply({ content: '✅ TFT maç sonucu kaydedildi!', ephemeral: false });
    },
};
