"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('profil')
        .setDescription('Oyuncu profilini görüntüle')
        .addUserOption(opt => opt.setName('kullanici')
        .setDescription('Profili görüntülenecek kullanıcı (boş bırakırsan kendi profilin)')
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
            const lolWinRate = player.stats.lol.wins + player.stats.lol.losses > 0
                ? ((player.stats.lol.wins / (player.stats.lol.wins + player.stats.lol.losses)) * 100).toFixed(1)
                : '0';
            const tftTop4Rate = player.stats.tft.matches > 0
                ? ((player.stats.tft.top4 / player.stats.tft.matches) * 100).toFixed(1)
                : '0';
            const recentRankings = player.stats.tft.rankings.slice(-10).join(', ') || '*Henüz maç yok*';
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x3498db)
                .setTitle(`📊 ${targetUser.username} Profili`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields({ name: '🎮 Discord', value: `<@${targetUser.id}>`, inline: true }, { name: '⚔️ LoL IGN', value: player.lolIgn || '*Belirtilmedi*', inline: true }, { name: '♟️ TFT IGN', value: player.tftIgn || player.lolIgn || '*Belirtilmedi*', inline: true }, { name: '💰 Bakiye', value: `${player.balance} 🪙`, inline: true }, { name: '\u200b', value: '\u200b', inline: true }, { name: '\u200b', value: '\u200b', inline: true }, { name: '⚔️ LoL İstatistikleri', value: `**Galibiyet:** ${player.stats.lol.wins}\n**Mağlubiyet:** ${player.stats.lol.losses}\n**Kazanma Oranı:** %${lolWinRate}`, inline: true }, { name: '♟️ TFT İstatistikleri', value: `**Toplam Maç:** ${player.stats.tft.matches}\n**Top 4:** ${player.stats.tft.top4}\n**Top 4 Oranı:** %${tftTop4Rate}\n**Puan:** ${player.stats.tft.points}`, inline: true }, { name: '📈 Son TFT Sıralamaları', value: recentRankings, inline: false })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Profil getirilemedi:', error);
            await interaction.reply({
                content: '❌ Profil getirilirken hata oluştu!',
                ephemeral: true
            });
        }
    },
};
