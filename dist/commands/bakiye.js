"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('bakiye')
        .setDescription('Bakiyenizi görüntüleyin')
        .addUserOption(opt => opt.setName('kullanici')
        .setDescription('Bakiyesi görüntülenecek kullanıcı')
        .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        try {
            const player = await databaseService_1.databaseService.getPlayer(targetUser.id);
            if (!player) {
                return interaction.reply({
                    content: `❌ ${targetUser.username} henüz kayıt olmamış! \`/kayit\` komutunu kullanabilir.`,
                    ephemeral: true
                });
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xf1c40f)
                .setTitle('💰 Bakiye')
                .setDescription(`**${targetUser.username}** bakiyesi`)
                .addFields({ name: '🪙 Mevcut Bakiye', value: `${player.balance} 🪙`, inline: true })
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Bakiye getirilemedi:', error);
            await interaction.reply({
                content: '❌ Bakiye getirilirken hata oluştu!',
                ephemeral: true
            });
        }
    },
};
