"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const voiceActivityService_1 = require("../services/voiceActivityService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ses')
        .setDescription('Sesli kanalda geçirilen süreyi göster')
        .addUserOption(option => option
        .setName('kullanici')
        .setDescription('Görüntülenecek kullanıcı (opsiyonel)')
        .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        await interaction.deferReply();
        const totalSeconds = await voiceActivityService_1.voiceActivityService.getUserVoiceTime(targetUser.id);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('🎤 Sesli Kanal İstatistikleri')
            .setDescription(`**${targetUser.username}** bugün sesli kanalda geçirdiği süre:\n\n` +
            `⏱️ **${hours} saat ${minutes} dakika ${seconds} saniye**\n\n` +
            `*Günlük ses süresi her gece sıfırlanır.*`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
