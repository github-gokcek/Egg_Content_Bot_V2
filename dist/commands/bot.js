"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const botStatusService_1 = require("../services/botStatusService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('bot')
        .setDescription('Bot yönetimi')
        .addSubcommand(sub => sub.setName('status')
        .setDescription('Bot durumunu görüntüle'))
        .addSubcommand(sub => sub.setName('mode')
        .setDescription('Bot modunu değiştir (Admin)')
        .addStringOption(opt => opt.setName('mod')
        .setDescription('Bot modu')
        .setRequired(true)
        .addChoices({ name: '🟢 Live (Canlı)', value: 'live' }, { name: '🟡 Dev (Test)', value: 'dev' }))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'status') {
            const mode = botStatusService_1.botStatusService.getMode();
            const modeEmoji = mode === 'live' ? '🟢' : '🟡';
            const modeText = mode === 'live' ? 'CANLI' : 'TEST';
            const modeDesc = mode === 'live'
                ? 'Tüm fonksiyonlar aktif çalışıyor'
                : 'Test modu - İşlemler simüle ediliyor, gerçek işlem yapılmıyor';
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(mode === 'live' ? 0x00ff00 : 0xffff00)
                .setTitle('🤖 Bot Durumu')
                .addFields({ name: 'Mod', value: `${modeEmoji} **${modeText}**`, inline: true }, { name: 'Açıklama', value: modeDesc, inline: false }, { name: 'Değiştirmek için', value: '`/bot mode` komutunu kullanın (Admin)', inline: false })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'mode') {
            if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!',
                    ephemeral: true
                });
            }
            const newMode = interaction.options.getString('mod', true);
            const oldMode = botStatusService_1.botStatusService.getMode();
            if (oldMode === newMode) {
                return interaction.reply({
                    content: `❌ Bot zaten ${newMode.toUpperCase()} modunda!`,
                    ephemeral: true
                });
            }
            botStatusService_1.botStatusService.setMode(newMode);
            const modeEmoji = newMode === 'live' ? '🟢' : '🟡';
            const modeText = newMode === 'live' ? 'CANLI' : 'TEST';
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(newMode === 'live' ? 0x00ff00 : 0xffff00)
                .setTitle('✅ Bot Modu Değiştirildi')
                .addFields({ name: 'Yeni Mod', value: `${modeEmoji} **${modeText}**`, inline: true }, { name: 'Önceki Mod', value: oldMode.toUpperCase(), inline: true })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
    },
};
