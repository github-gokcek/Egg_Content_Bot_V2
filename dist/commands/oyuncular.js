"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('oyuncular')
        .setDescription('Kayıtlı tüm oyuncuları listele')
        .addIntegerOption(option => option.setName('sayfa')
        .setDescription('Sayfa numarası (varsayılan: 1)')
        .setMinValue(1)
        .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const page = interaction.options.getInteger('sayfa') || 1;
            const playersPerPage = 10;
            const startIndex = (page - 1) * playersPerPage;
            // Tüm oyuncuları al
            const playersQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'players'), (0, firestore_1.orderBy)('discordId', 'asc'));
            const snapshot = await (0, firestore_1.getDocs)(playersQuery);
            if (snapshot.empty) {
                return interaction.editReply({ content: '❌ Henüz kayıtlı oyuncu yok!' });
            }
            const allPlayers = snapshot.docs.map(doc => doc.data());
            const totalPlayers = allPlayers.length;
            const totalPages = Math.ceil(totalPlayers / playersPerPage);
            if (page > totalPages) {
                return interaction.editReply({ content: `❌ Geçersiz sayfa! Toplam ${totalPages} sayfa var.` });
            }
            const playersOnPage = allPlayers.slice(startIndex, startIndex + playersPerPage);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x3498db)
                .setTitle('👥 Kayıtlı Oyuncular')
                .setDescription(`Toplam **${totalPlayers}** oyuncu kayıtlı`)
                .setFooter({ text: `Sayfa ${page}/${totalPages}` })
                .setTimestamp();
            let playersList = '';
            for (let i = 0; i < playersOnPage.length; i++) {
                const player = playersOnPage[i];
                const playerNumber = startIndex + i + 1;
                try {
                    const user = await interaction.client.users.fetch(player.discordId);
                    const username = user.username;
                    playersList += `**${playerNumber}.** ${username}\n`;
                    playersList += `├ 🎮 **LoL:** ${player.lolIgn || 'Belirtilmemiş'}\n`;
                    playersList += `├ ♟️ **TFT:** ${player.tftIgn || 'Belirtilmemiş'}\n`;
                    playersList += `└ 💰 **Bakiye:** ${player.balance || 0} 🪙\n\n`;
                }
                catch (error) {
                    playersList += `**${playerNumber}.** Bilinmeyen Kullanıcı (${player.discordId})\n`;
                    playersList += `├ 🎮 **LoL:** ${player.lolIgn || 'Belirtilmemiş'}\n`;
                    playersList += `├ ♟️ **TFT:** ${player.tftIgn || 'Belirtilmemiş'}\n`;
                    playersList += `└ 💰 **Bakiye:** ${player.balance || 0} 🪙\n\n`;
                }
            }
            embed.addFields({
                name: '📋 Oyuncu Listesi',
                value: playersList || 'Oyuncu bulunamadı',
                inline: false
            });
            // Sayfalama butonları
            const buttons = new discord_js_1.ActionRowBuilder();
            if (page > 1) {
                buttons.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`players_page_${page - 1}`)
                    .setLabel('◀️ Önceki')
                    .setStyle(discord_js_1.ButtonStyle.Primary));
            }
            if (page < totalPages) {
                buttons.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`players_page_${page + 1}`)
                    .setLabel('Sonraki ▶️')
                    .setStyle(discord_js_1.ButtonStyle.Primary));
            }
            const components = buttons.components.length > 0 ? [buttons] : [];
            await interaction.editReply({
                embeds: [embed],
                components
            });
        }
        catch (error) {
            console.error('Oyuncu listesi hatası:', error);
            await interaction.editReply({ content: '❌ Oyuncu listesi alınırken hata oluştu!' });
        }
    },
};
