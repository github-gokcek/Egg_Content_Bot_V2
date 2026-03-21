"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkReminders = checkReminders;
const discord_js_1 = require("discord.js");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
// Periyodik kontrol fonksiyonu (index.ts'den çağrılacak)
async function checkReminders(client) {
    try {
        const now = Date.now();
        const remindersSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'reminders'));
        for (const docSnap of remindersSnapshot.docs) {
            const reminder = docSnap.data();
            if (reminder.remindAt <= now) {
                // Hatırlatıcı zamanı geldi
                try {
                    const channel = await client.channels.fetch(reminder.channelId);
                    if (channel && channel.isTextBased()) {
                        await channel.send({
                            content: `⏰ <@${reminder.userId}> **Hatırlatıcı:** ${reminder.message}`
                        });
                    }
                }
                catch (error) {
                    // Kanal bulunamazsa DM gönder
                    try {
                        const user = await client.users.fetch(reminder.userId);
                        await user.send({
                            content: `⏰ **Hatırlatıcı:** ${reminder.message}`
                        });
                    }
                    catch (dmError) {
                        console.error('Hatırlatıcı gönderilemedi:', dmError);
                    }
                }
                // Hatırlatıcıyı sil
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'reminders', reminder.id));
            }
        }
    }
    catch (error) {
        console.error('Hatırlatıcı kontrolü hatası:', error);
    }
}
module.exports = {
    checkReminders,
    data: new discord_js_1.SlashCommandBuilder()
        .setName('hatırlat')
        .setDescription('Belirli bir süre sonra hatırlatıcı ayarla')
        .addStringOption(option => option.setName('mesaj')
        .setDescription('Hatırlatılacak mesaj')
        .setRequired(true))
        .addIntegerOption(option => option.setName('dakika')
        .setDescription('Kaç dakika sonra hatırlatılsın')
        .setMinValue(1)
        .setMaxValue(10080))
        .addIntegerOption(option => option.setName('saat')
        .setDescription('Kaç saat sonra hatırlatılsın')
        .setMinValue(1)
        .setMaxValue(168)),
    async execute(interaction) {
        const message = interaction.options.getString('mesaj', true);
        const minutes = interaction.options.getInteger('dakika');
        const hours = interaction.options.getInteger('saat');
        if (!minutes && !hours) {
            return interaction.reply({
                content: '❌ En az bir zaman birimi (dakika veya saat) belirtmelisiniz!',
                ephemeral: true
            });
        }
        let totalMinutes = 0;
        if (minutes)
            totalMinutes += minutes;
        if (hours)
            totalMinutes += hours * 60;
        const timeText = [];
        if (hours)
            timeText.push(`${hours} saat`);
        if (minutes)
            timeText.push(`${minutes} dakika`);
        const now = Date.now();
        const remindAt = now + (totalMinutes * 60 * 1000);
        const reminder = {
            id: `${interaction.user.id}_${now}`,
            userId: interaction.user.id,
            channelId: interaction.channelId,
            message,
            remindAt,
            createdAt: now
        };
        try {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'reminders', reminder.id), reminder);
            await interaction.reply({
                content: `⏰ Hatırlatıcı ayarlandı! ${timeText.join(' ')} sonra hatırlatılacaksınız.`,
                ephemeral: true
            });
        }
        catch (error) {
            console.error('Hatırlatıcı kaydedilemedi:', error);
            await interaction.reply({
                content: '❌ Hatırlatıcı ayarlanırken bir hata oluştu!',
                ephemeral: true
            });
        }
    },
};
