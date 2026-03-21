"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const questService_1 = require("../services/questService");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
module.exports = {
    name: discord_js_1.Events.MessageCreate,
    async execute(message) {
        // Bot mesajlarını ignore et
        if (message.author.bot)
            return;
        // DM'leri ignore et
        if (!message.guild)
            return;
        try {
            // AFK kontrolü - Mesaj atan kişi AFK'dan çıkar
            const afkDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'afkStatuses', message.author.id));
            if (afkDoc.exists()) {
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'afkStatuses', message.author.id));
                await message.reply({
                    content: `💤 AFK durumunuz kaldırıldı, hoş geldiniz!`,
                    allowedMentions: { repliedUser: false }
                }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => { }), 5000);
                }).catch(() => { });
            }
            // AFK mention kontrolü - Mention edilen kişi AFK mi?
            if (message.mentions.users.size > 0) {
                for (const [userId, user] of message.mentions.users) {
                    if (user.bot)
                        continue;
                    const mentionedAfkDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'afkStatuses', userId));
                    if (mentionedAfkDoc.exists()) {
                        const afkData = mentionedAfkDoc.data();
                        const setAt = new Date(afkData.setAt);
                        const now = new Date();
                        const duration = now.getTime() - setAt.getTime();
                        const hours = Math.floor(duration / (1000 * 60 * 60));
                        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                        let timeText = '';
                        if (hours > 0)
                            timeText += `${hours} saat `;
                        if (minutes > 0)
                            timeText += `${minutes} dakika`;
                        if (!timeText)
                            timeText = 'Az önce';
                        await message.reply({
                            content: `💤 ${user.username} şu anda AFK: **${afkData.message}** (${timeText})`,
                            allowedMentions: { repliedUser: false }
                        }).catch(() => { });
                        break; // Sadece ilk AFK kullanıcıyı bildir
                    }
                }
            }
            // Quest tracking
            await questService_1.questService.trackMessage(message.author.id, message);
            // Reply tracking
            if (message.reference?.messageId) {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                if (repliedMessage && !repliedMessage.author.bot) {
                    await questService_1.questService.trackReplyReceived(repliedMessage.author.id, repliedMessage.id);
                }
            }
        }
        catch (error) {
            console.error('Message event error:', error);
        }
    },
};
