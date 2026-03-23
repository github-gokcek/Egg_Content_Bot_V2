"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const databaseService_1 = require("./databaseService");
const logger_1 = require("../utils/logger");
// 📨 Mesaj/Etkileşim Görevleri
const MESSAGE_QUESTS = [
    { id: 'msg_10', emoji: '💬', name: 'Sohbet Başlangıcı', description: 'Sunucuda 10 mesaj gönder', reward: 20, target: 10, category: 'message', type: 'message_count' },
    { id: 'msg_25', emoji: '💬', name: 'Aktif Sohbet', description: 'Sunucuda 25 mesaj gönder', reward: 40, target: 25, category: 'message', type: 'message_count' },
    { id: 'msg_50', emoji: '💬', name: 'Mesaj Makinesi', description: 'Sunucuda 50 mesaj gönder', reward: 80, target: 50, category: 'message', type: 'message_count' },
    { id: 'msg_channels', emoji: '📢', name: 'Çok Kanallı', description: '5 farklı kanala mesaj gönder', reward: 30, target: 5, category: 'message', type: 'channels' },
    { id: 'msg_replies', emoji: '↩️', name: 'Yanıt Veren', description: '3 farklı kişiye yanıt ver', reward: 25, target: 3, category: 'message', type: 'replies' },
    { id: 'msg_emoji_use', emoji: '😀', name: 'Emoji Ustası', description: 'Mesajlarında 5 farklı emoji kullan', reward: 20, target: 5, category: 'message', type: 'emoji_use' },
    { id: 'msg_fast', emoji: '⚡', name: 'Hızlı Yazıcı', description: '10 dakika içinde 5 mesaj gönder', reward: 25, target: 5, category: 'message', type: 'fast_messages' },
    { id: 'msg_morning', emoji: '🌅', name: 'Sabah Kuşu', description: 'Sabah saatlerinde (06:00-12:00) 5 mesaj gönder', reward: 30, target: 5, category: 'message', type: 'morning_messages' },
    { id: 'msg_evening', emoji: '🌆', name: 'Akşam Aktif', description: 'Akşam saatlerinde (18:00-00:00) 5 mesaj gönder', reward: 30, target: 5, category: 'message', type: 'evening_messages' },
];
// 🎭 Sosyal Görevler
const SOCIAL_QUESTS = [
    { id: 'social_interact', emoji: '👥', name: 'Sosyal Kelebek', description: '5 farklı kişiye yanıt ver veya mentionla', reward: 30, target: 5, category: 'social', type: 'interact_users' },
    { id: 'social_reactions', emoji: '❤️', name: 'Tepki Veren', description: 'Birinin mesajına 3 farklı emoji ile tepki ver', reward: 20, target: 3, category: 'social', type: 'reaction_emoji_variety' },
    { id: 'social_react_users', emoji: '⭐', name: 'Topluluk Üyesi', description: '5 farklı kişinin mesajına tepki ver', reward: 25, target: 5, category: 'social', type: 'reaction_users' },
    { id: 'social_mentions', emoji: '📣', name: 'Etkileşimci', description: '3 farklı kullanıcıyı mentionla', reward: 25, target: 3, category: 'social', type: 'mentions' },
    { id: 'social_popular', emoji: '🌟', name: 'Popüler Mesaj', description: 'Bir mesajın 3 reaction alsın', reward: 35, target: 3, category: 'social', type: 'reaction_receive' },
];
// 🎰 Casino Görevleri
const CASINO_QUESTS = [
    { id: 'casino_daily', emoji: '🎁', name: 'Günlük Ödül', description: 'Günlük ödülünü topla (/günlük)', reward: 20, target: 1, category: 'casino', type: 'daily_reward' },
    { id: 'casino_slot_3', emoji: '🎰', name: 'Slot Denemesi', description: 'Slot makinesinde 3 kez oyna', reward: 25, target: 3, category: 'casino', type: 'slot_plays' },
    { id: 'casino_slot_5', emoji: '🎰', name: 'Slot Tutkunu', description: 'Slot makinesinde 5 kez oyna', reward: 40, target: 5, category: 'casino', type: 'slot_plays' },
    { id: 'casino_slot_10', emoji: '🎰', name: 'Slot Bağımlısı', description: 'Slot makinesinde 10 kez oyna', reward: 70, target: 10, category: 'casino', type: 'slot_plays' },
    { id: 'casino_bj_3', emoji: '🃏', name: 'Blackjack Başlangıcı', description: 'Blackjack\'te 3 el oyna', reward: 30, target: 3, category: 'casino', type: 'blackjack_plays' },
    { id: 'casino_bj_win', emoji: '🃏', name: 'Blackjack Ustası', description: 'Blackjack oyna ve kazan', reward: 50, target: 1, category: 'casino', type: 'blackjack_win' },
    { id: 'casino_coinflip_2', emoji: '🪙', name: 'Yazı Tura', description: 'Coinflip ile 2 kez oyna', reward: 25, target: 2, category: 'casino', type: 'coinflip_plays' },
    { id: 'casino_crash', emoji: '🚀', name: 'Crash Denemesi', description: 'Crash oyununda cashout yap', reward: 40, target: 1, category: 'casino', type: 'crash_cashout' },
    { id: 'casino_mines', emoji: '💣', name: 'Mayın Tarlası', description: 'Mines oyununda 5 kare aç', reward: 35, target: 5, category: 'casino', type: 'mines_tiles' },
    { id: 'casino_variety', emoji: '🎲', name: 'Çeşitlilik', description: '3 farklı casino oyununu dene', reward: 50, target: 3, category: 'casino', type: 'casino_variety' },
    { id: 'casino_spend', emoji: '💸', name: 'Yüksek Bahis', description: 'Günde toplam 500 coin harca', reward: 60, target: 500, category: 'casino', type: 'casino_spent' },
    { id: 'casino_big_win', emoji: '💰', name: 'Büyük Kazanç', description: 'Bir bahiste 100+ coin kazan', reward: 70, target: 100, category: 'casino', type: 'big_win' },
];
// 🔊 Ses Görevleri
const VOICE_QUESTS = [
    { id: 'voice_5min', emoji: '🎤', name: 'Ses Denemesi', description: 'Sesli kanala katıl ve 5 dakika kal', reward: 20, target: 1, category: 'voice', type: 'voice_5min' },
    { id: 'voice_15min', emoji: '🎤', name: 'Ses Sohbeti', description: 'Sesli kanala katıl ve 15 dakika kal', reward: 40, target: 1, category: 'voice', type: 'voice_15min' },
    { id: 'voice_30min', emoji: '🎤', name: 'Uzun Sohbet', description: 'Sesli kanala katıl ve 30 dakika kal', reward: 70, target: 1, category: 'voice', type: 'voice_30min' },
    { id: 'voice_1hour', emoji: '🎤', name: 'Ses Maratonu', description: 'Sesli kanalda 1 saat geçir', reward: 120, target: 1, category: 'voice', type: 'voice_1hour' },
];
// 📊 Bonus Görevleri
const BONUS_QUESTS = [
    { id: 'bonus_50msg', emoji: '🔥', name: 'Mesaj Bombardımanı', description: 'Bir günde 50 mesaj gönder', reward: 80, target: 50, category: 'bonus', type: 'message_count' },
    { id: 'bonus_voice_msg', emoji: '🎯', name: 'Aktif Dinleyici', description: 'Sesli kanalda 10 dk + 5 mesaj', reward: 60, target: 1, category: 'bonus', type: 'voice_message_combo' },
    { id: 'bonus_all_day', emoji: '⏰', name: 'Gün Boyu Aktif', description: '3 farklı saat diliminde mesaj gönder', reward: 50, target: 3, category: 'bonus', type: 'hourly_messages' },
];
// 🏆 Özel Görevler (Günlük görevler tamamlandıktan sonra)
const SPECIAL_QUESTS = [
    { id: 'special_200msg', emoji: '🏆', name: 'Mesaj Şampiyonu', description: '200 mesaj gönder', reward: 200, target: 200, category: 'special', type: 'message_count' },
    { id: 'special_500bet', emoji: '🏆', name: 'Yüksek Bahisçi', description: '500 coin bahis yap (toplam)', reward: 150, target: 500, category: 'special', type: 'casino_spent' },
    { id: 'special_2hour_voice', emoji: '🏆', name: 'Ses Kralı', description: 'Sesli kanalda 2 saat kal', reward: 250, target: 1, category: 'special', type: 'voice_2hour' },
    { id: 'special_10replies', emoji: '🏆', name: 'Sosyal Uzman', description: '10 farklı kişiye yanıt ver', reward: 180, target: 10, category: 'special', type: 'replies' },
    { id: 'special_slot_50', emoji: '🏆', name: 'Slot Makinesi', description: 'Slot makinesinde 50 kez oyna', reward: 200, target: 50, category: 'special', type: 'slot_plays' },
    { id: 'special_bj_10', emoji: '🏆', name: 'Blackjack Pro', description: 'Blackjack\'te 10 el oyna', reward: 180, target: 10, category: 'special', type: 'blackjack_plays' },
    { id: 'special_1000win', emoji: '🏆', name: 'Büyük Kazanan', description: 'Bir günde 1000 coin kazan', reward: 300, target: 1000, category: 'special', type: 'casino_wins' },
    { id: 'special_20reactions', emoji: '🏆', name: 'Tepki Ustası', description: '20 farklı mesaja emoji ile tepki ver', reward: 150, target: 20, category: 'special', type: 'reaction_messages' },
    { id: 'special_100msg_3h', emoji: '🏆', name: 'Hızlı Yazıcı', description: '3 saat içinde 100 mesaj gönder', reward: 250, target: 100, category: 'special', type: 'fast_messages_3h' },
    { id: 'special_2000spend', emoji: '🏆', name: 'Casino Patronu', description: 'Casino oyunlarında toplam 2000 coin harca', reward: 300, target: 2000, category: 'special', type: 'casino_spent' },
];
const ALL_QUESTS = [
    ...MESSAGE_QUESTS,
    ...SOCIAL_QUESTS,
    ...CASINO_QUESTS,
    ...VOICE_QUESTS,
    ...BONUS_QUESTS,
];
class QuestService {
    async getUserQuests(userId) {
        try {
            const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'userQuests', userId));
            if (!docSnap.exists())
                return null;
            const data = docSnap.data();
            return {
                userId: data.userId,
                lastReset: data.lastReset,
                quests: data.quests || [],
                specialQuest: data.specialQuest || undefined,
                allDailyCompleted: data.allDailyCompleted || false,
                messageCount: data.messageCount || 0,
                voiceMinutes: data.voiceMinutes || 0,
                reactionsGiven: data.reactionsGiven || 0,
                reactionsReceived: new Map(Object.entries(data.reactionsReceived || {})),
                mentionedUsers: new Set(data.mentionedUsers || []),
                emojisUsed: new Set(data.emojisUsed || []),
                repliesReceived: new Map(Object.entries(data.repliesReceived || {})),
                hourlyMessages: new Set(data.hourlyMessages || []),
                channelsMessaged: new Set(data.channelsMessaged || []),
                usedDailyCommand: data.usedDailyCommand || false,
                slotPlays: data.slotPlays || 0,
                blackjackPlays: data.blackjackPlays || 0,
                blackjackWins: data.blackjackWins || 0,
                coinflipPlays: data.coinflipPlays || 0,
                crashPlays: data.crashPlays || 0,
                minesPlays: data.minesPlays || 0,
                casinoWins: data.casinoWins || 0,
                casinoSpent: data.casinoSpent || 0,
                biggestSingleWin: data.biggestSingleWin || 0,
                duelloWins: data.duelloWins || 0,
                reactionGivenToUsers: new Set(data.reactionGivenToUsers || []),
                reactionGivenToMessages: new Set(data.reactionGivenToMessages || []),
                reactionEmojisUsed: new Set(data.reactionEmojisUsed || []),
                repliedToUsers: new Set(data.repliedToUsers || []),
                morningMessages: data.morningMessages || 0,
                eveningMessages: data.eveningMessages || 0,
                fastMessageTimestamps: data.fastMessageTimestamps || [],
                isResetting: data.isResetting || false,
                lastSaveTime: data.lastSaveTime || Date.now(),
            };
        }
        catch (error) {
            logger_1.Logger.error('getUserQuests error', error);
            return null;
        }
    }
    async initializeUserQuests(userId) {
        // Her kategoriden 2'şer görev seç
        const messageQuests = this.getRandomQuestsFromCategory(MESSAGE_QUESTS, 2);
        const socialQuests = this.getRandomQuestsFromCategory(SOCIAL_QUESTS, 2);
        const casinoQuests = this.getRandomQuestsFromCategory(CASINO_QUESTS, 2);
        const voiceQuests = this.getRandomQuestsFromCategory(VOICE_QUESTS, 2);
        const bonusQuests = this.getRandomQuestsFromCategory(BONUS_QUESTS, 1);
        const dailyQuests = [
            ...messageQuests,
            ...socialQuests,
            ...casinoQuests,
            ...voiceQuests,
            ...bonusQuests,
        ];
        // Özel görev seç (günlük görevler tamamlandıktan sonra açılacak)
        const specialQuest = this.getRandomQuestsFromCategory(SPECIAL_QUESTS, 1)[0];
        const userQuests = {
            userId,
            lastReset: new Date().toISOString(),
            quests: dailyQuests,
            specialQuest,
            allDailyCompleted: false,
            messageCount: 0,
            voiceMinutes: 0,
            reactionsGiven: 0,
            reactionsReceived: new Map(),
            mentionedUsers: new Set(),
            emojisUsed: new Set(),
            repliesReceived: new Map(),
            hourlyMessages: new Set(),
            channelsMessaged: new Set(),
            usedDailyCommand: false,
            slotPlays: 0,
            blackjackPlays: 0,
            blackjackWins: 0,
            coinflipPlays: 0,
            crashPlays: 0,
            minesPlays: 0,
            casinoWins: 0,
            casinoSpent: 0,
            biggestSingleWin: 0,
            duelloWins: 0,
            reactionGivenToUsers: new Set(),
            reactionGivenToMessages: new Set(),
            reactionEmojisUsed: new Set(),
            repliedToUsers: new Set(),
            morningMessages: 0,
            eveningMessages: 0,
            fastMessageTimestamps: [],
            isResetting: false,
            lastSaveTime: Date.now(),
        };
        await this.saveUserQuests(userQuests);
        return userQuests;
    }
    getRandomQuestsFromCategory(quests, count) {
        const shuffled = [...quests].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map(q => ({
            ...q,
            progress: 0,
            completed: false,
        }));
    }
    async saveUserQuests(userQuests, force = false) {
        try {
            const now = Date.now();
            // Undefined değerleri temizle
            const cleanData = {
                userId: userQuests.userId,
                lastReset: userQuests.lastReset,
                quests: userQuests.quests,
                allDailyCompleted: userQuests.allDailyCompleted || false,
                messageCount: userQuests.messageCount || 0,
                voiceMinutes: userQuests.voiceMinutes || 0,
                reactionsGiven: userQuests.reactionsGiven || 0,
                reactionsReceived: Object.fromEntries(userQuests.reactionsReceived || new Map()),
                mentionedUsers: Array.from(userQuests.mentionedUsers || []),
                emojisUsed: Array.from(userQuests.emojisUsed || []),
                repliesReceived: Object.fromEntries(userQuests.repliesReceived || new Map()),
                hourlyMessages: Array.from(userQuests.hourlyMessages || []),
                channelsMessaged: Array.from(userQuests.channelsMessaged || []),
                usedDailyCommand: userQuests.usedDailyCommand || false,
                slotPlays: userQuests.slotPlays || 0,
                blackjackPlays: userQuests.blackjackPlays || 0,
                blackjackWins: userQuests.blackjackWins || 0,
                coinflipPlays: userQuests.coinflipPlays || 0,
                crashPlays: userQuests.crashPlays || 0,
                minesPlays: userQuests.minesPlays || 0,
                casinoWins: userQuests.casinoWins || 0,
                casinoSpent: userQuests.casinoSpent || 0,
                biggestSingleWin: userQuests.biggestSingleWin || 0,
                duelloWins: userQuests.duelloWins || 0,
                reactionGivenToUsers: Array.from(userQuests.reactionGivenToUsers || []),
                reactionGivenToMessages: Array.from(userQuests.reactionGivenToMessages || []),
                reactionEmojisUsed: Array.from(userQuests.reactionEmojisUsed || []),
                repliedToUsers: Array.from(userQuests.repliedToUsers || []),
                morningMessages: userQuests.morningMessages || 0,
                eveningMessages: userQuests.eveningMessages || 0,
                fastMessageTimestamps: userQuests.fastMessageTimestamps || [],
                isResetting: userQuests.isResetting || false,
                lastSaveTime: now,
            };
            // specialQuest sadece varsa ekle
            if (userQuests.specialQuest) {
                cleanData.specialQuest = userQuests.specialQuest;
            }
            // Firebase'e kaydet
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'userQuests', userQuests.userId), cleanData);
            userQuests.lastSaveTime = now;
        }
        catch (error) {
            logger_1.Logger.error('saveUserQuests error', error);
        }
    }
    async checkAndResetDaily(userId) {
        const userQuests = await this.getUserQuests(userId);
        if (!userQuests)
            return false;
        // Reset işlemi devam ediyorsa bekle
        if (userQuests.isResetting) {
            logger_1.Logger.warn('Reset already in progress', { userId });
            return false;
        }
        const lastReset = new Date(userQuests.lastReset);
        const now = new Date();
        // Farklı gün mü?
        if (lastReset.getDate() !== now.getDate() ||
            lastReset.getMonth() !== now.getMonth() ||
            lastReset.getFullYear() !== now.getFullYear()) {
            // Reset flag'i set et
            userQuests.isResetting = true;
            await this.saveUserQuests(userQuests);
            // Yeni quest'leri oluştur
            await this.initializeUserQuests(userId);
            logger_1.Logger.success('Daily quests reset', { userId });
            return true;
        }
        return false;
    }
    async trackMessage(userId, message) {
        this.trackMessageAsync(userId, message).catch(error => {
            logger_1.Logger.error('trackMessage async error', error);
        });
    }
    async trackMessageAsync(userId, message) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            // Reset olduysa yeni veriyi çek
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.messageCount++;
        // Kanal tracking
        if (message.channelId) {
            userQuests.channelsMessaged.add(message.channelId);
        }
        // Saat dilimi takibi
        const hour = new Date().getHours();
        userQuests.hourlyMessages.add(hour);
        // Sabah mesajı kontrolü (06:00 - 12:00)
        if (hour >= 6 && hour < 12) {
            userQuests.morningMessages++;
        }
        // Akşam mesajı kontrolü (18:00 - 00:00)
        if (hour >= 18 && hour < 24) {
            userQuests.eveningMessages++;
        }
        // Hızlı mesaj tracking (10 dakika ve 3 saat için)
        const now = Date.now();
        userQuests.fastMessageTimestamps.push(now);
        // Sadece son 3 saati tut
        userQuests.fastMessageTimestamps = userQuests.fastMessageTimestamps.filter(ts => now - ts <= 3 * 60 * 60 * 1000);
        // Mention takibi - DÜZELTİLMİŞ
        if (message.mentions?.users && message.mentions.users.size > 0) {
            message.mentions.users.forEach((user) => {
                if (user.id !== userId && !user.bot) {
                    userQuests.mentionedUsers.add(user.id);
                    logger_1.Logger.info('Mention tracked', {
                        userId,
                        mentionedUserId: user.id,
                        totalMentions: userQuests.mentionedUsers.size
                    });
                }
            });
        }
        // Reply tracking - DÜZELTİLMİŞ
        if (message.reference?.messageId) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
                if (repliedMessage && repliedMessage.author.id !== userId && !repliedMessage.author.bot) {
                    userQuests.repliedToUsers.add(repliedMessage.author.id);
                    logger_1.Logger.info('Reply tracked', {
                        userId,
                        repliedToUserId: repliedMessage.author.id,
                        totalReplies: userQuests.repliedToUsers.size
                    });
                }
            }
            catch (error) {
                logger_1.Logger.error('Reply tracking error', error);
            }
        }
        // Geliştirilmiş Emoji takibi - TÜM emojiler
        // Discord custom emojiler + Unicode emojiler (tüm kategoriler)
        const emojiRegex = /<a?:[\w_]+:\d+>|[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F300}-\u{1FAFF}]|[\u{E0020}-\u{E007F}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}]|[\u{2049}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{00A9}]|[\u{00AE}]|[\u{2122}]|[\u{2139}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{2328}]|[\u{23CF}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2600}-\u{2604}]|[\u{260E}]|[\u{2611}]|[\u{2614}-\u{2615}]|[\u{2618}]|[\u{261D}]|[\u{2620}]|[\u{2622}-\u{2623}]|[\u{2626}]|[\u{262A}]|[\u{262E}-\u{262F}]|[\u{2638}-\u{263A}]|[\u{2640}]|[\u{2642}]|[\u{2648}-\u{2653}]|[\u{265F}-\u{2660}]|[\u{2663}]|[\u{2665}-\u{2666}]|[\u{2668}]|[\u{267B}]|[\u{267E}-\u{267F}]|[\u{2692}-\u{2697}]|[\u{2699}]|[\u{269B}-\u{269C}]|[\u{26A0}-\u{26A1}]|[\u{26A7}]|[\u{26AA}-\u{26AB}]|[\u{26B0}-\u{26B1}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26C8}]|[\u{26CE}]|[\u{26CF}]|[\u{26D1}]|[\u{26D3}-\u{26D4}]|[\u{26E9}-\u{26EA}]|[\u{26F0}-\u{26F5}]|[\u{26F7}-\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;
        const emojis = message.content?.match(emojiRegex);
        if (emojis) {
            emojis.forEach((emoji) => userQuests.emojisUsed.add(emoji));
            logger_1.Logger.info('Emojis tracked in message', {
                userId,
                emojisFound: emojis.length,
                totalUniqueEmojis: userQuests.emojisUsed.size,
                emojis: emojis.slice(0, 10) // İlk 10 emojiyi göster
            });
        }
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests); // Debounce ile kaydet
    }
    async trackVoice(userId, minutes) {
        this.trackVoiceAsync(userId, minutes).catch(error => {
            logger_1.Logger.error('trackVoice async error', error);
        });
    }
    async trackVoiceAsync(userId, minutes) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        // CRITICAL FIX: Toplam dakikayı direkt set et (voiceActivityService zaten toplamı gönderiyor)
        // Ama eğer yeni değer eskisinden küçükse (reset olmuş olabilir), increment yap
        if (minutes < userQuests.voiceMinutes) {
            // Reset olmuş, yeni session başlamış
            userQuests.voiceMinutes = minutes;
        }
        else {
            // Normal durum, toplamı güncelle
            userQuests.voiceMinutes = minutes;
        }
        logger_1.Logger.info('Voice tracked', {
            userId,
            totalMinutes: userQuests.voiceMinutes
        });
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackReactionGiven(userId, messageId, messageAuthorId, emoji) {
        this.trackReactionGivenAsync(userId, messageId, messageAuthorId, emoji).catch(error => {
            logger_1.Logger.error('trackReactionGiven async error', error);
        });
    }
    async trackReactionGivenAsync(userId, messageId, messageAuthorId, emoji) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.reactionsGiven++;
        // Farklı mesajlara reaction tracking
        userQuests.reactionGivenToMessages.add(messageId);
        // Farklı kullanıcılara reaction tracking
        if (messageAuthorId && messageAuthorId !== userId) {
            userQuests.reactionGivenToUsers.add(messageAuthorId);
            logger_1.Logger.info('Reaction to user tracked', {
                userId,
                targetUserId: messageAuthorId,
                totalUniqueUsers: userQuests.reactionGivenToUsers.size
            });
        }
        // Reaction emoji tracking
        if (emoji) {
            userQuests.reactionEmojisUsed.add(emoji);
            logger_1.Logger.info('Reaction emoji tracked', {
                userId,
                emoji,
                totalUniqueEmojis: userQuests.reactionEmojisUsed.size
            });
        }
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackReactionReceived(userId, messageId) {
        this.trackReactionReceivedAsync(userId, messageId).catch(error => {
            logger_1.Logger.error('trackReactionReceived async error', error);
        });
    }
    async trackReactionReceivedAsync(userId, messageId) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        const current = userQuests.reactionsReceived.get(messageId) || 0;
        userQuests.reactionsReceived.set(messageId, current + 1);
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackReplyReceived(userId, messageId) {
        this.trackReplyReceivedAsync(userId, messageId).catch(error => {
            logger_1.Logger.error('trackReplyReceived async error', error);
        });
    }
    async trackReplyReceivedAsync(userId, messageId) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        const current = userQuests.repliesReceived.get(messageId) || 0;
        userQuests.repliesReceived.set(messageId, current + 1);
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackRastgeleUsed(userId) {
        this.trackRastgeleUsedAsync(userId).catch(error => {
            logger_1.Logger.error('trackRastgeleUsed async error', error);
        });
    }
    async trackRastgeleUsedAsync(userId) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        // Rastgele komutu kullanıldı - şu an için bir görev yok ama gelecekte eklenebilir
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    // Casino tracking fonksiyonları
    async trackDailyCommand(userId) {
        this.trackDailyCommandAsync(userId).catch(error => {
            logger_1.Logger.error('trackDailyCommand async error', error);
        });
    }
    async trackDailyCommandAsync(userId) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.usedDailyCommand = true;
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackSlotPlay(userId) {
        this.trackSlotPlayAsync(userId).catch(error => {
            logger_1.Logger.error('trackSlotPlay async error', error);
        });
    }
    async trackSlotPlayAsync(userId) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.slotPlays++;
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackBlackjackPlay(userId, won = false) {
        this.trackBlackjackPlayAsync(userId, won).catch(error => {
            logger_1.Logger.error('trackBlackjackPlay async error', error);
        });
    }
    async trackBlackjackPlayAsync(userId, won = false) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.blackjackPlays++;
        if (won) {
            userQuests.blackjackWins++;
        }
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackCoinflipPlay(userId) {
        this.trackCoinflipPlayAsync(userId).catch(error => {
            logger_1.Logger.error('trackCoinflipPlay async error', error);
        });
    }
    async trackCoinflipPlayAsync(userId) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.coinflipPlays++;
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackCrashPlay(userId) {
        this.trackCrashPlayAsync(userId).catch(error => {
            logger_1.Logger.error('trackCrashPlay async error', error);
        });
    }
    async trackCrashPlayAsync(userId) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.crashPlays++;
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackMinesTiles(userId, tiles) {
        this.trackMinesTilesAsync(userId, tiles).catch(error => {
            logger_1.Logger.error('trackMinesTiles async error', error);
        });
    }
    async trackMinesTilesAsync(userId, tiles) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.minesPlays += tiles;
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackCasinoSpent(userId, amount) {
        this.trackCasinoSpentAsync(userId, amount).catch(error => {
            logger_1.Logger.error('trackCasinoSpent async error', error);
        });
    }
    async trackCasinoSpentAsync(userId, amount) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.casinoSpent += amount;
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackCasinoWin(userId, amount, isSingleBet = false) {
        this.trackCasinoWinAsync(userId, amount, isSingleBet).catch(error => {
            logger_1.Logger.error('trackCasinoWin async error', error);
        });
    }
    async trackCasinoWinAsync(userId, amount, isSingleBet = false) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.casinoWins += amount;
        // Tek bahiste en büyük kazanç tracking
        if (isSingleBet && amount > userQuests.biggestSingleWin) {
            userQuests.biggestSingleWin = amount;
            logger_1.Logger.info('New biggest single win', { userId, amount });
        }
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async trackDuelloWin(userId) {
        this.trackDuelloWinAsync(userId).catch(error => {
            logger_1.Logger.error('trackDuelloWin async error', error);
        });
    }
    async trackDuelloWinAsync(userId) {
        let userQuests = await this.getUserQuests(userId);
        if (!userQuests) {
            userQuests = await this.initializeUserQuests(userId);
        }
        const resetOccurred = await this.checkAndResetDaily(userId);
        if (resetOccurred) {
            userQuests = await this.getUserQuests(userId);
            if (!userQuests)
                return;
        }
        userQuests.duelloWins++;
        await this.updateQuestProgress(userQuests);
        await this.saveUserQuests(userQuests);
    }
    async updateQuestProgress(userQuests) {
        // Günlük görevleri güncelle
        for (const quest of userQuests.quests) {
            if (quest.completed)
                continue;
            switch (quest.type) {
                case 'message_count':
                    quest.progress = userQuests.messageCount;
                    break;
                case 'channels':
                    quest.progress = userQuests.channelsMessaged.size;
                    break;
                case 'replies':
                    quest.progress = userQuests.repliedToUsers.size;
                    break;
                case 'emoji_use':
                    quest.progress = userQuests.emojisUsed.size;
                    break;
                case 'reaction_emoji_variety':
                    quest.progress = userQuests.reactionEmojisUsed.size;
                    break;
                case 'morning_messages':
                    quest.progress = userQuests.morningMessages;
                    break;
                case 'evening_messages':
                    quest.progress = userQuests.eveningMessages;
                    break;
                case 'fast_messages':
                    // Son 10 dakikadaki mesajları say
                    const tenMinAgo = Date.now() - 10 * 60 * 1000;
                    quest.progress = userQuests.fastMessageTimestamps.filter(ts => ts >= tenMinAgo).length;
                    break;
                case 'interact_users':
                    // Sadece unique kullanıcıları say (reply veya mention)
                    const interactedUsers = new Set([...userQuests.repliedToUsers, ...userQuests.mentionedUsers]);
                    quest.progress = interactedUsers.size;
                    break;
                case 'reaction_users':
                    quest.progress = userQuests.reactionGivenToUsers.size;
                    break;
                case 'mentions':
                    quest.progress = userQuests.mentionedUsers.size;
                    break;
                case 'reaction_receive':
                    quest.progress = userQuests.reactionsReceived.size > 0
                        ? Math.max(...Array.from(userQuests.reactionsReceived.values()))
                        : 0;
                    break;
                case 'daily_reward':
                    quest.progress = userQuests.usedDailyCommand ? 1 : 0;
                    break;
                case 'slot_plays':
                    quest.progress = userQuests.slotPlays;
                    break;
                case 'blackjack_plays':
                    quest.progress = userQuests.blackjackPlays;
                    break;
                case 'blackjack_win':
                    quest.progress = userQuests.blackjackWins;
                    break;
                case 'coinflip_plays':
                    quest.progress = userQuests.coinflipPlays;
                    break;
                case 'crash_cashout':
                    quest.progress = userQuests.crashPlays;
                    break;
                case 'mines_tiles':
                    quest.progress = userQuests.minesPlays;
                    break;
                case 'casino_variety':
                    let varietyCount = 0;
                    if (userQuests.slotPlays > 0)
                        varietyCount++;
                    if (userQuests.blackjackPlays > 0)
                        varietyCount++;
                    if (userQuests.coinflipPlays > 0)
                        varietyCount++;
                    if (userQuests.crashPlays > 0)
                        varietyCount++;
                    if (userQuests.minesPlays > 0)
                        varietyCount++;
                    quest.progress = varietyCount;
                    break;
                case 'casino_spent':
                    quest.progress = userQuests.casinoSpent;
                    break;
                case 'big_win':
                    quest.progress = userQuests.biggestSingleWin;
                    break;
                case 'voice_5min':
                    // 5 dakika
                    quest.progress = userQuests.voiceMinutes >= 5 ? 1 : 0;
                    break;
                case 'voice_15min':
                    // 15 dakika
                    quest.progress = userQuests.voiceMinutes >= 15 ? 1 : 0;
                    break;
                case 'voice_30min':
                    // 30 dakika
                    quest.progress = userQuests.voiceMinutes >= 30 ? 1 : 0;
                    break;
                case 'voice_1hour':
                    // 60 dakika
                    quest.progress = userQuests.voiceMinutes >= 60 ? 1 : 0;
                    break;
                case 'voice_message_combo':
                    // 10 dakika ses + 5 mesaj
                    quest.progress = (userQuests.voiceMinutes >= 10 && userQuests.messageCount >= 5) ? 1 : 0;
                    break;
                case 'hourly_messages':
                    quest.progress = userQuests.hourlyMessages.size;
                    break;
            }
            if (quest.progress >= quest.target && !quest.completed) {
                quest.completed = true;
                await this.giveReward(userQuests.userId, quest.reward);
                logger_1.Logger.success('Quest completed', { userId: userQuests.userId, questId: quest.id, reward: quest.reward });
                // Quest tamamlandığında force save yap
                await this.saveUserQuests(userQuests, true);
            }
        }
        // Tüm günlük görevler tamamlandı mı kontrol et
        const allCompleted = userQuests.quests.every(q => q.completed);
        if (allCompleted && !userQuests.allDailyCompleted) {
            userQuests.allDailyCompleted = true;
            logger_1.Logger.success('All daily quests completed! Special quest unlocked', { userId: userQuests.userId });
            // Tüm görevler tamamlandığında force save yap
            await this.saveUserQuests(userQuests, true);
        }
        // Özel görevi güncelle (sadece günlük görevler tamamlandıysa)
        if (userQuests.allDailyCompleted && userQuests.specialQuest && !userQuests.specialQuest.completed) {
            const special = userQuests.specialQuest;
            switch (special.type) {
                case 'message_count':
                    special.progress = userQuests.messageCount;
                    break;
                case 'casino_spent':
                    special.progress = userQuests.casinoSpent;
                    break;
                case 'voice_2hour':
                    // 120 dakika
                    special.progress = userQuests.voiceMinutes >= 120 ? 1 : 0;
                    break;
                case 'replies':
                    special.progress = userQuests.repliedToUsers.size;
                    break;
                case 'slot_plays':
                    special.progress = userQuests.slotPlays;
                    break;
                case 'blackjack_plays':
                    special.progress = userQuests.blackjackPlays;
                    break;
                case 'casino_wins':
                    special.progress = userQuests.casinoWins;
                    break;
                case 'reaction_messages':
                    special.progress = userQuests.reactionGivenToMessages.size;
                    break;
                case 'fast_messages_3h':
                    // Son 3 saatteki mesajları say
                    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
                    special.progress = userQuests.fastMessageTimestamps.filter(ts => ts >= threeHoursAgo).length;
                    break;
            }
            if (special.progress >= special.target && !special.completed) {
                special.completed = true;
                await this.giveReward(userQuests.userId, special.reward);
                logger_1.Logger.success('Special quest completed!', { userId: userQuests.userId, questId: special.id, reward: special.reward });
                // Özel görev tamamlandığında force save yap
                await this.saveUserQuests(userQuests, true);
            }
        }
    }
    async giveReward(userId, reward) {
        const player = await databaseService_1.databaseService.getPlayer(userId);
        if (player) {
            player.balance += reward;
            await databaseService_1.databaseService.updatePlayer(player);
        }
    }
}
exports.questService = new QuestService();
