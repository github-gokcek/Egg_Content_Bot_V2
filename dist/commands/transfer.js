"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('transfer')
        .setDescription('Başka bir kullanıcıya coin gönder')
        .addUserOption(opt => opt.setName('alici')
        .setDescription('Coin alacak kullanıcı')
        .setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar')
        .setDescription('Gönderilecek coin miktarı')
        .setRequired(true)
        .setMinValue(1)),
    async execute(interaction) {
        const recipient = interaction.options.getUser('alici', true);
        const amount = interaction.options.getInteger('miktar', true);
        // Validasyonlar
        if (recipient.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Kendinize coin gönderemezsiniz!',
                ephemeral: true
            });
        }
        if (recipient.bot) {
            return interaction.reply({
                content: '❌ Bota coin gönderemezsiniz!',
                ephemeral: true
            });
        }
        // Gönderici oyuncuyu getir
        let sender = await databaseService_1.databaseService.getPlayer(interaction.user.id);
        if (!sender) {
            sender = {
                discordId: interaction.user.id,
                username: interaction.user.username,
                balance: 0,
                createdAt: new Date(),
                stats: { lol: { wins: 0, losses: 0 }, tft: { matches: 0, top4: 0, rankings: [], points: 0 } }
            };
            await databaseService_1.databaseService.savePlayer(sender);
        }
        // Alıcı oyuncuyu getir
        let recipientPlayer = await databaseService_1.databaseService.getPlayer(recipient.id);
        if (!recipientPlayer) {
            recipientPlayer = {
                discordId: recipient.id,
                username: recipient.username,
                balance: 0,
                createdAt: new Date(),
                stats: { lol: { wins: 0, losses: 0 }, tft: { matches: 0, top4: 0, rankings: [], points: 0 } }
            };
            await databaseService_1.databaseService.savePlayer(recipientPlayer);
        }
        // Bakiye kontrolü
        if (sender.balance < amount) {
            return interaction.reply({
                content: `❌ Yetersiz bakiye! Mevcut: ${sender.balance} 🪙, Gönderilecek: ${amount} 🪙`,
                ephemeral: true
            });
        }
        // Transfer yap
        sender.balance -= amount;
        recipientPlayer.balance += amount;
        await databaseService_1.databaseService.updatePlayer(sender);
        await databaseService_1.databaseService.updatePlayer(recipientPlayer);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Coin Transfer Başarılı')
            .addFields({ name: '📤 Gönderen', value: `${interaction.user.username}`, inline: true }, { name: '📥 Alan', value: `${recipient.username}`, inline: true }, { name: '💰 Miktar', value: `${amount} 🪙`, inline: true }, { name: '💳 Gönderenin Yeni Bakiyesi', value: `${sender.balance} 🪙`, inline: true }, { name: '💳 Alanın Yeni Bakiyesi', value: `${recipientPlayer.balance} 🪙`, inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        logger_1.Logger.success('Coin transfer yapıldı', {
            sender: interaction.user.id,
            recipient: recipient.id,
            amount
        });
    }
};
