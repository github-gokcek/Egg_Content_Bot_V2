"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
const questService_1 = require("../services/questService");
const DAILY_REWARD = 100;
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('günlük')
        .setDescription('Günlük 100 coin ödülünü topla!'),
    async execute(interaction) {
        const player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
        if (!player) {
            return interaction.reply({
                content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
                ephemeral: true
            });
        }
        // Son claim zamanını kontrol et
        const dailyDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'dailyRewards', interaction.user.id));
        if (dailyDoc.exists()) {
            const data = dailyDoc.data();
            const lastClaim = new Date(data.lastClaim);
            const now = new Date();
            // Aynı gün mü kontrol et
            if (lastClaim.getDate() === now.getDate() &&
                lastClaim.getMonth() === now.getMonth() &&
                lastClaim.getFullYear() === now.getFullYear()) {
                // Bir sonraki claim zamanını hesapla
                const nextClaim = new Date(lastClaim);
                nextClaim.setDate(nextClaim.getDate() + 1);
                nextClaim.setHours(0, 0, 0, 0);
                const timeLeft = nextClaim.getTime() - now.getTime();
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                return interaction.reply({
                    content: `⏰ Günlük ödülünü zaten topladın! Bir sonraki ödül için **${hoursLeft} saat ${minutesLeft} dakika** beklemen gerekiyor.`,
                    ephemeral: true
                });
            }
        }
        // Ödülü ver
        player.balance += DAILY_REWARD;
        await databaseService_1.databaseService.updatePlayer(player);
        // Son claim zamanını kaydet
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'dailyRewards', interaction.user.id), {
            userId: interaction.user.id,
            lastClaim: new Date().toISOString()
        });
        // Quest tracking
        await questService_1.questService.trackDailyCommand(interaction.user.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xffd700)
            .setTitle('🎁 Günlük Ödül Toplandı!')
            .setDescription(`Günlük ödülünü başarıyla topladın!`)
            .addFields({ name: '💰 Kazanç', value: `+${DAILY_REWARD} 🪙`, inline: true }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true })
            .setFooter({ text: 'Her gün tekrar gelebilirsin!' })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
