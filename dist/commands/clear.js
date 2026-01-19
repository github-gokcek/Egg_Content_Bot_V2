"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('clear')
        .setDescription('Mesajları sil (Admin)')
        .addIntegerOption(option => option.setName('sayi')
        .setDescription('Silinecek mesaj sayısı (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const amount = interaction.options.getInteger('sayi', true);
        if (!interaction.channel?.isTextBased()) {
            return interaction.reply({ content: '❌ Bu komut sadece metin kanallarında kullanılabilir!', ephemeral: true });
        }
        try {
            const messages = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({
                content: `✅ **${messages.size}** mesaj silindi!`,
                ephemeral: true
            });
            logger_1.Logger.success('Mesajlar silindi', {
                amount: messages.size,
                channelId: interaction.channelId,
                adminId: interaction.user.id
            });
        }
        catch (error) {
            logger_1.Logger.error('Mesaj silme hatası', error);
            await interaction.reply({
                content: '❌ Mesajlar silinirken hata oluştu! (14 günden eski mesajlar silinemez)',
                ephemeral: true
            });
        }
    },
};
