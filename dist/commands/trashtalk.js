"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const inventoryService_1 = require("../services/inventoryService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('trashtalk')
        .setDescription('Birine trashtalk at (Trashtalk eşyası gerektirir)')
        .addUserOption(option => option.setName('target')
        .setDescription('Trashtalk atılacak kullanıcı')
        .setRequired(true))
        .addStringOption(option => option.setName('mesaj')
        .setDescription('Trashtalk mesajı')
        .setRequired(true)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target', true);
        const message = interaction.options.getString('mesaj', true);
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Kendine trashtalk atamazsın!',
                ephemeral: true
            });
        }
        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Botlara trashtalk atamazsın!',
                ephemeral: true
            });
        }
        // Trashtalk eşyası kontrolü
        const hasTrashtalk = await inventoryService_1.inventoryService.hasItem(interaction.user.id, 'trashtalk');
        if (!hasTrashtalk) {
            return interaction.reply({
                content: '❌ Trashtalk eşyanız yok! Marketten satın alabilirsiniz: `/market buy item:trashtalk`',
                ephemeral: true
            });
        }
        // Trashtalk eşyasını kullan
        const usedItem = await inventoryService_1.inventoryService.useItem(interaction.user.id, 'trashtalk', {
            target: targetUser.id,
            message
        });
        if (!usedItem) {
            return interaction.reply({
                content: '❌ Trashtalk eşyası kullanılırken bir hata oluştu!',
                ephemeral: true
            });
        }
        // Trashtalk mesajını gönder
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle('📢 Sunucunun Dikkatine')
            .setDescription(`**${interaction.user.username}** → **${targetUser.username}**\n\n` +
            `# ${message}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: `${interaction.user.username} tarafından gönderildi` })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
