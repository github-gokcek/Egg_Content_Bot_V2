"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('toplu-set-coin')
        .setDescription('Sunucudaki tüm üyelerin parasını belirtilen değere ayarla')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addIntegerOption(opt => opt.setName('miktar')
        .setDescription('Ayarlanacak coin miktarı')
        .setRequired(true)
        .setMinValue(0)),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const amount = interaction.options.getInteger('miktar', true);
            const guild = interaction.guild;
            if (!guild) {
                return interaction.editReply('❌ Sunucu bulunamadı!');
            }
            // Tüm üyeleri getir
            const members = await guild.members.fetch();
            let processedCount = 0;
            let skippedCount = 0;
            const errors = [];
            // Her üyeyi işle
            for (const [, member] of members) {
                // Botları atla
                if (member.user.bot) {
                    skippedCount++;
                    continue;
                }
                try {
                    // Oyuncuyu getir
                    let player = await databaseService_1.databaseService.getPlayer(member.id);
                    if (!player) {
                        // Oyuncu yoksa oluştur
                        player = {
                            discordId: member.id,
                            username: member.user.username,
                            balance: 0,
                            voicePackets: 0,
                            createdAt: new Date(),
                            stats: {
                                lol: { wins: 0, losses: 0 },
                                tft: { matches: 0, top4: 0, rankings: [], points: 0 }
                            }
                        };
                    }
                    // Parasını ayarla
                    player.balance = amount;
                    await databaseService_1.databaseService.updatePlayer(player);
                    processedCount++;
                    logger_1.Logger.success('Toplu set coin işlemi', { userId: member.id, username: member.user.username, amount });
                }
                catch (error) {
                    errors.push(`${member.user.username}: ${error}`);
                    logger_1.Logger.error('Toplu set coin işlemi hatası', error);
                }
            }
            // Sonuç embed'i
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('💰 Toplu Coin Ayarlama')
                .addFields({ name: '🎯 Ayarlanan Miktar', value: `${amount} 🪙`, inline: true }, { name: '✅ İşlenen Üye', value: `${processedCount} üye`, inline: true }, { name: '⏭️ Atlanan Üye', value: `${skippedCount} üye`, inline: true }, { name: '👥 Toplam İşlenen', value: `${processedCount + skippedCount} üye`, inline: true })
                .setTimestamp();
            if (errors.length > 0) {
                embed.addFields({
                    name: '⚠️ Hatalar',
                    value: errors.slice(0, 10).join('\n') + (errors.length > 10 ? `\n... ve ${errors.length - 10} hata daha` : '')
                });
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            logger_1.Logger.error('Toplu set coin işlemi hatası', error);
            await interaction.editReply('❌ Toplu coin ayarlama işlemi sırasında bir hata oluştu!');
        }
    }
};
