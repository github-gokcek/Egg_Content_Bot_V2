"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('toplu-kayit')
        .setDescription('Sunucudaki hesabı olmayan tüm üyeleri otomatik kaydeder')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const guild = interaction.guild;
            if (!guild) {
                return interaction.editReply('❌ Sunucu bulunamadı!');
            }
            // Tüm üyeleri getir
            const members = await guild.members.fetch();
            let createdCount = 0;
            let skippedCount = 0;
            const errors = [];
            // Her üyeyi kontrol et
            for (const [, member] of members) {
                // Botları atla
                if (member.user.bot) {
                    skippedCount++;
                    continue;
                }
                try {
                    // Oyuncunun zaten hesabı olup olmadığını kontrol et
                    const existingPlayer = await databaseService_1.databaseService.getPlayer(member.id);
                    if (!existingPlayer) {
                        // Yeni oyuncu oluştur
                        const newPlayer = {
                            discordId: member.id,
                            username: member.user.username,
                            balance: 0,
                            voicePackets: 0,
                            createdAt: new Date(),
                            stats: {
                                lol: {
                                    wins: 0,
                                    losses: 0
                                },
                                tft: {
                                    matches: 0,
                                    top4: 0,
                                    rankings: [],
                                    points: 0
                                }
                            }
                        };
                        await databaseService_1.databaseService.savePlayer(newPlayer);
                        createdCount++;
                        logger_1.Logger.success('Toplu kayıt: Oyuncu oluşturuldu', { userId: member.id, username: member.user.username });
                    }
                    else {
                        skippedCount++;
                    }
                }
                catch (error) {
                    errors.push(`${member.user.username} (${member.id}): ${error}`);
                    logger_1.Logger.error('Toplu kayıt sırasında hata', error);
                }
            }
            // Sonuç embed'i
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ Toplu Kayıt Tamamlandı')
                .addFields({ name: '✨ Yeni Hesap Oluşturulan', value: `${createdCount} üye`, inline: true }, { name: '⏭️ Zaten Hesabı Olan', value: `${skippedCount} üye`, inline: true }, { name: '👥 Toplam İşlenen', value: `${createdCount + skippedCount} üye`, inline: true })
                .setTimestamp();
            if (errors.length > 0) {
                embed.addFields({
                    name: '⚠️ Hatalar',
                    value: errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n... ve ${errors.length - 5} hata daha` : '')
                });
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            logger_1.Logger.error('Toplu kayıt hatası', error);
            await interaction.editReply('❌ Toplu kayıt sırasında bir hata oluştu!');
        }
    }
};
