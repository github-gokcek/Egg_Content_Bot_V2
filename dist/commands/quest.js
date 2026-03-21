"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const questService_1 = require("../services/questService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('quest')
        .setDescription('Günlük görevlerini görüntüle')
        .addUserOption(option => option.setName('user')
        .setDescription('Görevlerini görmek istediğin kullanıcı (opsiyonel)')
        .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        await interaction.deferReply();
        let userQuests = await questService_1.questService.getUserQuests(targetUser.id);
        if (!userQuests) {
            userQuests = await questService_1.questService.initializeUserQuests(targetUser.id);
        }
        else {
            await questService_1.questService.checkAndResetDaily(targetUser.id);
            userQuests = await questService_1.questService.getUserQuests(targetUser.id);
        }
        if (!userQuests) {
            return interaction.editReply({
                content: '❌ Görevler yüklenirken bir hata oluştu!'
            });
        }
        const completedCount = userQuests.quests.filter(q => q.completed).length;
        const totalReward = userQuests.quests
            .filter(q => q.completed)
            .reduce((sum, q) => sum + q.reward, 0);
        // Kategorilere göre görevleri grupla
        const categories = {
            message: { name: '📨 Mesaj/Etkileşim', quests: [] },
            social: { name: '🎭 Sosyal', quests: [] },
            casino: { name: '🎰 Casino', quests: [] },
            voice: { name: '🔊 Ses', quests: [] },
            bonus: { name: '📊 Bonus', quests: [] },
        };
        userQuests.quests.forEach(quest => {
            if (categories[quest.category]) {
                categories[quest.category].quests.push(quest);
            }
        });
        let questList = '';
        for (const [key, cat] of Object.entries(categories)) {
            if (cat.quests.length > 0) {
                questList += `\n**${cat.name}**\n`;
                cat.quests.forEach(quest => {
                    const progressBar = this.createProgressBar(quest.progress, quest.target);
                    const status = quest.completed ? '✅' : '⏳';
                    questList += `${quest.emoji} **${quest.name}** ${status}\n`;
                    questList += `${quest.description}\n`;
                    questList += `${progressBar} ${quest.progress}/${quest.target} | 💰 ${quest.reward} coin\n`;
                });
            }
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(completedCount === userQuests.quests.length ? 0x00ff00 : 0x3498db)
            .setTitle(`📋 ${targetUser.username} - Günlük Görevler`)
            .setDescription(`**İlerleme:** ${completedCount}/${userQuests.quests.length} görev tamamlandı\n` +
            `**Kazanılan:** ${totalReward} 🪙\n` +
            questList)
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        // Özel görev bilgisi
        if (userQuests.allDailyCompleted && userQuests.specialQuest) {
            const special = userQuests.specialQuest;
            const specialBar = this.createProgressBar(special.progress, special.target);
            const specialStatus = special.completed ? '✅' : '⏳';
            embed.addFields({
                name: '🏆 ÖZEL GÖREV (Tüm günlük görevler tamamlandı!)',
                value: `${special.emoji} **${special.name}** ${specialStatus}\n` +
                    `${special.description}\n` +
                    `${specialBar} ${special.progress}/${special.target} | 💰 ${special.reward} coin`,
                inline: false
            });
        }
        else if (completedCount === userQuests.quests.length) {
            embed.addFields({
                name: '🎉 Tebrikler!',
                value: 'Bugünün tüm günlük görevlerini tamamladın! Özel görev açıldı!',
                inline: false
            });
        }
        embed.setFooter({ text: 'Görevler her gün sıfırlanır ve yeni görevler atanır!' });
        await interaction.editReply({ embeds: [embed] });
    },
    createProgressBar(current, target) {
        const percentage = Math.min(current / target, 1);
        const filled = Math.round(percentage * 10);
        const empty = 10 - filled;
        return '▰'.repeat(filled) + '▱'.repeat(empty);
    }
};
