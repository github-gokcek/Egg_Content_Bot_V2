"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const questService_1 = require("../services/questService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('questdebug')
        .setDescription('Görev tracking detaylarını görüntüle (debug)')
        .addUserOption(option => option.setName('user')
        .setDescription('Kontrol edilecek kullanıcı (opsiyonel)')
        .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        await interaction.deferReply({ ephemeral: true });
        let userQuests = await questService_1.questService.getUserQuests(targetUser.id);
        if (!userQuests) {
            return interaction.editReply({
                content: '❌ Bu kullanıcının quest verisi bulunamadı!'
            });
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x3498db)
            .setTitle(`🔍 ${targetUser.username} - Quest Debug`)
            .setDescription('Detaylı quest tracking bilgileri')
            .addFields({
            name: '📊 Genel İstatistikler',
            value: `**Mesaj Sayısı:** ${userQuests.messageCount}\n` +
                `**Ses Dakikası:** ${userQuests.voiceMinutes}\n` +
                `**Verilen Reaction:** ${userQuests.reactionsGiven}\n` +
                `**İlk Mesaj:** ${userQuests.firstMessageToday ? '✅' : '❌'}\n` +
                `**Gece Mesajı:** ${userQuests.nightMessageSent ? '✅' : '❌'}\n` +
                `**Rastgele Kullanıldı:** ${userQuests.usedRastgele ? '✅' : '❌'}`,
            inline: false
        }, {
            name: '👥 Farklı Kullanıcılara Reaction',
            value: `**Toplam:** ${userQuests.reactionGivenToUsers?.size || 0} farklı kullanıcı\n` +
                `**Kullanıcılar:** ${userQuests.reactionGivenToUsers?.size > 0 ? Array.from(userQuests.reactionGivenToUsers).map(id => `<@${id}>`).join(', ') : 'Henüz yok'}`,
            inline: false
        }, {
            name: '💬 Farklı Mesajlara Reaction',
            value: `**Toplam:** ${userQuests.reactionGivenToMessages?.size || 0} farklı mesaj`,
            inline: true
        }, {
            name: '🏷️ Mention Edilen Kullanıcılar',
            value: `**Toplam:** ${userQuests.mentionedUsers?.size || 0} farklı kullanıcı`,
            inline: true
        }, {
            name: '😀 Kullanılan Emojiler',
            value: `**Toplam:** ${userQuests.emojisUsed?.size || 0} farklı emoji`,
            inline: true
        }, {
            name: '🕐 Saat Dilimleri',
            value: `**Toplam:** ${userQuests.hourlyMessages?.size || 0} farklı saat\n` +
                `**Saatler:** ${userQuests.hourlyMessages?.size > 0 ? Array.from(userQuests.hourlyMessages).sort((a, b) => a - b).join(', ') : 'Henüz yok'}`,
            inline: false
        }, {
            name: '📅 Son Reset',
            value: new Date(userQuests.lastReset).toLocaleString('tr-TR'),
            inline: false
        })
            .setFooter({ text: 'Bu komut sadece debug amaçlıdır' })
            .setTimestamp();
        // Aktif görevleri göster
        const activeQuests = userQuests.quests.map(q => `${q.emoji} **${q.name}**: ${q.progress}/${q.target} ${q.completed ? '✅' : ''}`).join('\n');
        embed.addFields({
            name: '📋 Aktif Görevler',
            value: activeQuests || 'Görev yok',
            inline: false
        });
        await interaction.editReply({ embeds: [embed] });
    },
};
