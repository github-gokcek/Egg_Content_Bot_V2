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
const patchNotesService_1 = require("../services/patchNotesService");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('testpatch')
        .setDescription('Son patch notlarını manuel olarak getir (test için)')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(option => option
        .setName('oyun')
        .setDescription('Hangi oyunun patch notlarını getirmek istiyorsun?')
        .setRequired(true)
        .addChoices({ name: 'League of Legends', value: 'lol' }, { name: 'Teamfight Tactics', value: 'tft' }, { name: 'Her İkisi', value: 'both' })),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const game = interaction.options.getString('oyun', true);
        const config = await patchNotesService_1.patchNotesService.getPatchConfig(interaction.guildId);
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
                const lolPatch = await patchNotesService_1.patchNotesService.fetchLatestPatch('lol');
                if (lolPatch) {
                    const lolRole = interaction.guild?.roles.cache.find(r => r.name.toLowerCase() === 'lol');
                    const mention = lolRole ? `<@&${lolRole.id}>` : '@LoL';
                    const { EmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
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
                    await patchNotesService_1.patchNotesService.updateLastPatch(interaction.guildId, 'lol', lolPatch.title);
                    sentCount++;
                    logger_1.Logger.success('LoL patch manuel paylaşıldı', { guildId: interaction.guildId, patch: lolPatch.title });
                }
            }
            if (game === 'tft' || game === 'both') {
                const tftPatch = await patchNotesService_1.patchNotesService.fetchLatestPatch('tft');
                if (tftPatch) {
                    const tftRole = interaction.guild?.roles.cache.find(r => r.name.toLowerCase() === 'tft');
                    const mention = tftRole ? `<@&${tftRole.id}>` : '@TFT';
                    const { EmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
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
                    await patchNotesService_1.patchNotesService.updateLastPatch(interaction.guildId, 'tft', tftPatch.title);
                    sentCount++;
                    logger_1.Logger.success('TFT patch manuel paylaşıldı', { guildId: interaction.guildId, patch: tftPatch.title });
                }
            }
            if (sentCount > 0) {
                await interaction.editReply({
                    content: `✅ ${sentCount} patch notu ${channel} kanalında paylaşıldı!`
                });
            }
            else {
                await interaction.editReply({
                    content: '❌ Patch notları getirilemedi. RSS feed\'e erişim sorunu olabilir.'
                });
            }
        }
        catch (error) {
            logger_1.Logger.error('Test patch hatası', error);
            await interaction.editReply({
                content: '❌ Patch notları getirilirken hata oluştu!'
            });
        }
    },
};
