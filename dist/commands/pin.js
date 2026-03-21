"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const inventoryService_1 = require("../services/inventoryService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('pin')
        .setDescription('Bir mesajı sabitle (Pin eşyası gerektirir)')
        .addStringOption(option => option.setName('mesaj')
        .setDescription('Sabitlenecek mesaj')
        .setRequired(true)),
    async execute(interaction) {
        const messageContent = interaction.options.getString('mesaj', true);
        // Pin eşyası kontrolü
        const hasPin = await inventoryService_1.inventoryService.hasItem(interaction.user.id, 'pin');
        if (!hasPin) {
            return interaction.reply({
                content: '❌ Pin eşyanız yok! Marketten satın alabilirsiniz: `/market buy item:pin`',
                ephemeral: true
            });
        }
        // Pin eşyasını kullan
        const usedItem = await inventoryService_1.inventoryService.useItem(interaction.user.id, 'pin', { message: messageContent });
        if (!usedItem) {
            return interaction.reply({
                content: '❌ Pin eşyası kullanılırken bir hata oluştu!',
                ephemeral: true
            });
        }
        // Mesajı gönder ve pinle
        const sentMessage = await interaction.channel.send({
            content: `📌 **${interaction.user.username} tarafından sabitlendi:**\n\n${messageContent}`
        });
        try {
            await sentMessage.pin();
            await interaction.reply({
                content: '✅ Mesajınız başarıyla sabitlendi!',
                ephemeral: true
            });
        }
        catch (error) {
            await interaction.reply({
                content: '❌ Mesaj sabitlenirken bir hata oluştu! (Bot yetkisi eksik olabilir)',
                ephemeral: true
            });
        }
    },
};
