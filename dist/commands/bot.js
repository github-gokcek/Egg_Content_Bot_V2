"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdMessage = sendAdMessage;
const discord_js_1 = require("discord.js");
const botSettings_1 = require("../services/botSettings");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
async function sendAdMessage(interaction) {
    const adChannelId = await (0, botSettings_1.getAdChannel)();
    if (!adChannelId) {
        await interaction.reply({ content: '❌ Reklam kanalı ayarlanmamış! `/set reklam` komutuyla ayarlayın.', ephemeral: true });
        return;
    }
    const channel = await interaction.client.channels.fetch(adChannelId);
    if (!channel || !channel.isTextBased()) {
        await interaction.reply({ content: '❌ Reklam kanalı bulunamadı!', ephemeral: true });
        return;
    }
    const imagePath = path_1.default.join(process.cwd(), 'assetler', 'Ninja.png');
    // Görsel dosyası kontrolü
    if (!(0, fs_1.existsSync)(imagePath)) {
        await interaction.reply({ content: '❌ Reklam görseli bulunamadı! (assetler/Ninja.png)', ephemeral: true });
        return;
    }
    const attachment = new discord_js_1.AttachmentBuilder(imagePath);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('🎮 Botun Tüm Özelliklerini Keşfet!')
        .setDescription('**Casino sistemini** denediniz mi? 🎰\n' +
        '**RPG maceralarına** katıldınız mı? ⚔️\n' +
        '**Günlük görevlerinizi** tamamladınız mı? 📋\n\n' +
        '**Komutları keşfet:** `/yardim`')
        .setImage('attachment://Ninja.png')
        .setTimestamp();
    await channel.send({ embeds: [embed], files: [attachment] });
    await interaction.reply({ content: '✅ Reklam mesajı gönderildi!', ephemeral: true });
}
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('bot')
        .setDescription('Bot yönetim komutları')
        .addSubcommand(subcommand => subcommand
        .setName('reklam')
        .setDescription('Reklam mesajını manuel olarak gönder')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'reklam') {
            await sendAdMessage(interaction);
        }
    },
};
