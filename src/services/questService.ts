import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { databaseService } from './databaseService';
import { dailyStatsService } from './dailyStatsService';
import { Logger } from '../utils/logger';

export interface Quest {
  id: string;
  emoji: string;
  name: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  category: 'message' | 'social' | 'casino' | 'voice' | 'bonus' | 'special';
  type: string;
}

export interface UserQuests {
  userId: string;
  lastReset: string; // ISO date
  quests: Quest[];
  specialQuest?: Quest; // Özel görev (günlük görevler tamamlandıktan sonra)
  allDailyCompleted: boolean; // Tüm günlük görevler tamamlandı mı
  messageCount: number;
  voiceMinutes: number; // Toplam ses dakikası
  reactionsGiven: number;
  reactionsReceived: Map<string, number>; // messageId -> count
  mentionedUsers: Set<string>;
  emojisUsed: Set<string>;
  repliesReceived: Map<string, number>; // messageId -> count
  hourlyMessages: Set<number>; // hours (0-23)
  channelsMessaged: Set<string>; // Farklı kanallara mesaj tracking
  usedDailyCommand: boolean; // /günlük kullanıldı mı
  slotPlays: number; // Slot oynanma sayısı
  blackjackPlays: number; // Blackjack oynanma sayısı
  blackjackWins: number; // Blackjack kazanma sayısı
  coinflipPlays: number; // Coinflip oynanma sayısı
  crashPlays: number; // Crash oynanma sayısı
  minesPlays: number; // Mines oynanma sayısı
  casinoWins: number; // Casino kazançları (coin)
  casinoSpent: number; // Casino harcamaları (coin)
  biggestSingleWin: number; // Tek bahiste en büyük kazanç
  duelloWins: number; // Duello kazanma sayısı
  reactionGivenToUsers: Set<string>; // Farklı kullanıcılara reaction tracking
  reactionGivenToMessages: Set<string>; // Farklı mesajlara reaction tracking
  reactionEmojisUsed: Set<string>; // Reaction'da kullanılan farklı emojiler
  repliedToUsers: Set<string>; // Farklı kullanıcılara yanıt tracking
  morningMessages: number; // Sabah saatlerinde gönderilen mesaj sayısı
  eveningMessages: number; // Akşam saatlerinde gönderilen mesaj sayısı
  fastMessageTimestamps: number[]; // Hızlı mesaj timestamp'leri
  isResetting: boolean; // Reset işlemi devam ediyor mu (race condition önleme)
  lastSaveTime: number; // Son kayıt zamanı (race condition önleme)
}

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
  async getUserQuests(userId: string): Promise<UserQuests | null> {
    try {
      const docSnap = await getDoc(doc(db, 'userQuests', userId));
      if (!docSnap.exists()) return null;

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
      } as UserQuests;
    } catch (error) {
      Logger.error('getUserQuests error', error);
      return null;
    }
  }

  async initializeUserQuests(userId: string): Promise<UserQuests> {
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

    const userQuests: UserQuests = {
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

  private getRandomQuestsFromCategory(quests: any[], count: number): Quest[] {
    const shuffled = [...quests].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(q => ({
      ...q,
      progress: 0,
      completed: false,
    }));
  }

  async saveUserQuests(userQuests: UserQuests, force: boolean = false): Promise<void> {
    try {
      const now = Date.now();

      // Undefined değerleri temizle
      const cleanData: any = {
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
      await setDoc(doc(db, 'userQuests', userQuests.userId), cleanData);
      
      userQuests.lastSaveTime = now;
    } catch (error) {
      Logger.error('saveUserQuests error', error);
    }
  }

  async checkAndResetDaily(userId: string): Promise<boolean> {
    const userQuests = await this.getUserQuests(userId);
    if (!userQuests) return false;

    // Reset işlemi devam ediyorsa bekle
    if (userQuests.isResetting) {
      Logger.warn('Reset already in progress', { userId });
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
      Logger.success('Daily quests reset', { userId });
      return true;
    }
    return false;
  }

  async trackMessage(userId: string, message: any): Promise<void> {
    this.trackMessageAsync(userId, message).catch(error => {
      Logger.error('trackMessage async error', error);
    });
  }

  private async trackMessageAsync(userId: string, message: any): Promise<void> {
    // Daily stats'e kaydet
    await dailyStatsService.incrementMessage(userId, message.channelId);

    // Mention tracking
    if (message.mentions?.users && message.mentions.users.size > 0) {
      for (const user of message.mentions.users.values()) {
        if (user.id !== userId && !user.bot) {
          await dailyStatsService.addMention(userId, user.id);
        }
      }
    }

    // Reply tracking
    if (message.reference?.messageId) {
      try {
        const repliedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
        if (repliedMessage && repliedMessage.author.id !== userId && !repliedMessage.author.bot) {
          await dailyStatsService.addReply(userId, repliedMessage.author.id);
        }
      } catch (error) {
        Logger.error('Reply tracking error', error);
      }
    }

    // Emoji tracking
    const emojiRegex = /<a?:[\w_]+:\d+>|[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F300}-\u{1FAFF}]|[\u{E0020}-\u{E007F}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}]|[\u{2049}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{00A9}]|[\u{00AE}]|[\u{2122}]|[\u{2139}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{2328}]|[\u{23CF}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2600}-\u{2604}]|[\u{260E}]|[\u{2611}]|[\u{2614}-\u{2615}]|[\u{2618}]|[\u{261D}]|[\u{2620}]|[\u{2622}-\u{2623}]|[\u{2626}]|[\u{262A}]|[\u{262E}-\u{262F}]|[\u{2638}-\u{263A}]|[\u{2640}]|[\u{2642}]|[\u{2648}-\u{2653}]|[\u{265F}-\u{2660}]|[\u{2663}]|[\u{2665}-\u{2666}]|[\u{2668}]|[\u{267B}]|[\u{267E}-\u{267F}]|[\u{2692}-\u{2697}]|[\u{2699}]|[\u{269B}-\u{269C}]|[\u{26A0}-\u{26A1}]|[\u{26A7}]|[\u{26AA}-\u{26AB}]|[\u{26B0}-\u{26B1}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26C8}]|[\u{26CE}]|[\u{26CF}]|[\u{26D1}]|[\u{26D3}-\u{26D4}]|[\u{26E9}-\u{26EA}]|[\u{26F0}-\u{26F5}]|[\u{26F7}-\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;
    const emojis = message.content?.match(emojiRegex);
    if (emojis) {
      for (const emoji of emojis) {
        await dailyStatsService.addEmoji(userId, emoji);
      }
    }

    // Quest progress güncelle
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }
    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackVoice(userId: string, minutes: number): Promise<void> {
    this.trackVoiceAsync(userId, minutes).catch(error => {
      Logger.error('trackVoice async error', error);
    });
  }

  private async trackVoiceAsync(userId: string, minutes: number): Promise<void> {
    // Daily stats'e kaydet (incremental değil, total)
    const dailyStats = await dailyStatsService.getDailyStats(userId);
    const increment = minutes - dailyStats.voiceMinutes;
    if (increment > 0) {
      await dailyStatsService.incrementVoiceMinutes(userId, increment);
    }

    // Quest progress güncelle
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }
    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackReactionGiven(userId: string, messageId: string, messageAuthorId?: string, emoji?: string): Promise<void> {
    this.trackReactionGivenAsync(userId, messageId, messageAuthorId, emoji).catch(error => {
      Logger.error('trackReactionGiven async error', error);
    });
  }

  private async trackReactionGivenAsync(userId: string, messageId: string, messageAuthorId?: string, emoji?: string): Promise<void> {
    await dailyStatsService.incrementReactionGiven(userId);
    if (emoji) {
      await dailyStatsService.addEmoji(userId, emoji);
    }

    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    // Unique tracking için userQuests kullan (günlük stats'te Set yok)
    if (messageId) {
      userQuests.reactionGivenToMessages.add(messageId);
    }
    if (messageAuthorId && messageAuthorId !== userId) {
      userQuests.reactionGivenToUsers.add(messageAuthorId);
    }
    if (emoji) {
      userQuests.reactionEmojisUsed.add(emoji);
    }

    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackReactionReceived(userId: string, messageId: string): Promise<void> {
    this.trackReactionReceivedAsync(userId, messageId).catch(error => {
      Logger.error('trackReactionReceived async error', error);
    });
  }

  private async trackReactionReceivedAsync(userId: string, messageId: string): Promise<void> {
    await dailyStatsService.incrementReactionReceived(userId);

    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    const current = userQuests.reactionsReceived.get(messageId) || 0;
    userQuests.reactionsReceived.set(messageId, current + 1);

    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackReplyReceived(userId: string, messageId: string): Promise<void> {
    this.trackReplyReceivedAsync(userId, messageId).catch(error => {
      Logger.error('trackReplyReceived async error', error);
    });
  }

  private async trackReplyReceivedAsync(userId: string, messageId: string): Promise<void> {
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    const resetOccurred = await this.checkAndResetDaily(userId);
    if (resetOccurred) {
      userQuests = await this.getUserQuests(userId);
      if (!userQuests) return;
    }
    
    const current = userQuests.repliesReceived.get(messageId) || 0;
    userQuests.repliesReceived.set(messageId, current + 1);

    await this.updateQuestProgress(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackRastgeleUsed(userId: string): Promise<void> {
    this.trackRastgeleUsedAsync(userId).catch(error => {
      Logger.error('trackRastgeleUsed async error', error);
    });
  }

  private async trackRastgeleUsedAsync(userId: string): Promise<void> {
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    const resetOccurred = await this.checkAndResetDaily(userId);
    if (resetOccurred) {
      userQuests = await this.getUserQuests(userId);
      if (!userQuests) return;
    }
    
    // Rastgele komutu kullanıldı - şu an için bir görev yok ama gelecekte eklenebilir

    await this.updateQuestProgress(userQuests);
    await this.saveUserQuests(userQuests);
  }

  // Casino tracking fonksiyonları
  async trackDailyCommand(userId: string): Promise<void> {
    this.trackDailyCommandAsync(userId).catch(error => {
      Logger.error('trackDailyCommand async error', error);
    });
  }

  private async trackDailyCommandAsync(userId: string): Promise<void> {
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    const resetOccurred = await this.checkAndResetDaily(userId);
    if (resetOccurred) {
      userQuests = await this.getUserQuests(userId);
      if (!userQuests) return;
    }
    
    userQuests.usedDailyCommand = true;

    await this.updateQuestProgress(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackSlotPlay(userId: string): Promise<void> {
    this.trackSlotPlayAsync(userId).catch(error => {
      Logger.error('trackSlotPlay async error', error);
    });
  }

  private async trackSlotPlayAsync(userId: string): Promise<void> {
    await dailyStatsService.incrementCasinoPlay(userId, 'slot');

    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }
    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackBlackjackPlay(userId: string, won: boolean = false): Promise<void> {
    this.trackBlackjackPlayAsync(userId, won).catch(error => {
      Logger.error('trackBlackjackPlay async error', error);
    });
  }

  private async trackBlackjackPlayAsync(userId: string, won: boolean = false): Promise<void> {
    await dailyStatsService.incrementCasinoPlay(userId, 'blackjack');
    if (won) {
      await dailyStatsService.incrementCasinoWin(userId);
    }

    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    // Blackjack win tracking (userQuests'te tutulacak)
    if (won) {
      userQuests.blackjackWins++;
    }

    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackCoinflipPlay(userId: string): Promise<void> {
    this.trackCoinflipPlayAsync(userId).catch(error => {
      Logger.error('trackCoinflipPlay async error', error);
    });
  }

  private async trackCoinflipPlayAsync(userId: string): Promise<void> {
    await dailyStatsService.incrementCasinoPlay(userId, 'coinflip');

    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }
    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackCrashPlay(userId: string): Promise<void> {
    this.trackCrashPlayAsync(userId).catch(error => {
      Logger.error('trackCrashPlay async error', error);
    });
  }

  private async trackCrashPlayAsync(userId: string): Promise<void> {
    await dailyStatsService.incrementCasinoPlay(userId, 'crash');

    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }
    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackMinesTiles(userId: string, tiles: number): Promise<void> {
    this.trackMinesTilesAsync(userId, tiles).catch(error => {
      Logger.error('trackMinesTiles async error', error);
    });
  }

  private async trackMinesTilesAsync(userId: string, tiles: number): Promise<void> {
    // Mines için her tile bir play sayılır
    for (let i = 0; i < tiles; i++) {
      await dailyStatsService.incrementCasinoPlay(userId, 'mines');
    }

    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }
    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackCasinoSpent(userId: string, amount: number): Promise<void> {
    this.trackCasinoSpentAsync(userId, amount).catch(error => {
      Logger.error('trackCasinoSpent async error', error);
    });
  }

  private async trackCasinoSpentAsync(userId: string, amount: number): Promise<void> {
    await dailyStatsService.incrementCasinoSpent(userId, amount);

    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }
    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackCasinoWin(userId: string, amount: number, isSingleBet: boolean = false): Promise<void> {
    this.trackCasinoWinAsync(userId, amount, isSingleBet).catch(error => {
      Logger.error('trackCasinoWin async error', error);
    });
  }

  private async trackCasinoWinAsync(userId: string, amount: number, isSingleBet: boolean = false): Promise<void> {
    await dailyStatsService.incrementCasinoWin(userId);

    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    // Casino wins ve biggest single win userQuests'te tutulacak
    userQuests.casinoWins += amount;
    if (isSingleBet && amount > userQuests.biggestSingleWin) {
      userQuests.biggestSingleWin = amount;
    }

    await this.updateQuestProgressFromDailyStats(userQuests);
    await this.saveUserQuests(userQuests);
  }

  async trackDuelloWin(userId: string): Promise<void> {
    this.trackDuelloWinAsync(userId).catch(error => {
      Logger.error('trackDuelloWin async error', error);
    });
  }

  private async trackDuelloWinAsync(userId: string): Promise<void> {
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    const resetOccurred = await this.checkAndResetDaily(userId);
    if (resetOccurred) {
      userQuests = await this.getUserQuests(userId);
      if (!userQuests) return;
    }
    
    userQuests.duelloWins++;

    await this.updateQuestProgress(userQuests);
    await this.saveUserQuests(userQuests);
  }

  private async updateQuestProgressFromDailyStats(userQuests: UserQuests): Promise<void> {
    // Daily stats'ten veri çek
    const dailyStats = await dailyStatsService.getDailyStats(userQuests.userId);

    // Günlük görevleri güncelle
    for (const quest of userQuests.quests) {
      if (quest.completed) continue;

      switch (quest.type) {
        case 'message_count':
          quest.progress = dailyStats.messagesCount;
          break;
        case 'channels':
          quest.progress = dailyStats.channelsUsed.size;
          break;
        case 'replies':
          quest.progress = dailyStats.repliesGiven.size;
          break;
        case 'emoji_use':
          quest.progress = dailyStats.emojisUsed.size;
          break;
        case 'reaction_emoji_variety':
          quest.progress = userQuests.reactionEmojisUsed.size;
          break;
        case 'morning_messages':
          // Sabah mesajları için hourlyActivity'den say
          const morningHours = [6, 7, 8, 9, 10, 11];
          const morningCount = Array.from(dailyStats.hourlyActivity).filter(h => morningHours.includes(h)).length;
          quest.progress = morningCount > 0 ? dailyStats.messagesCount : 0; // Basitleştirilmiş
          break;
        case 'evening_messages':
          // Akşam mesajları için hourlyActivity'den say
          const eveningHours = [18, 19, 20, 21, 22, 23];
          const eveningCount = Array.from(dailyStats.hourlyActivity).filter(h => eveningHours.includes(h)).length;
          quest.progress = eveningCount > 0 ? dailyStats.messagesCount : 0; // Basitleştirilmiş
          break;
        case 'fast_messages':
          // Hızlı mesaj - userQuests'ten al (timestamp tracking gerekli)
          const tenMinAgo = Date.now() - 10 * 60 * 1000;
          quest.progress = userQuests.fastMessageTimestamps.filter(ts => ts >= tenMinAgo).length;
          break;
        case 'interact_users':
          // Mention + reply unique users
          const interactedUsers = new Set([...dailyStats.repliesGiven, ...dailyStats.mentionsGiven]);
          quest.progress = interactedUsers.size;
          break;
        case 'reaction_users':
          quest.progress = userQuests.reactionGivenToUsers.size;
          break;
        case 'mentions':
          quest.progress = dailyStats.mentionsGiven.size;
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
          quest.progress = dailyStats.slotPlays;
          break;
        case 'blackjack_plays':
          quest.progress = dailyStats.blackjackPlays;
          break;
        case 'blackjack_win':
          quest.progress = userQuests.blackjackWins;
          break;
        case 'coinflip_plays':
          quest.progress = dailyStats.coinflipPlays;
          break;
        case 'crash_cashout':
          quest.progress = dailyStats.crashPlays;
          break;
        case 'mines_tiles':
          quest.progress = dailyStats.minesPlays;
          break;
        case 'casino_variety':
          let varietyCount = 0;
          if (dailyStats.slotPlays > 0) varietyCount++;
          if (dailyStats.blackjackPlays > 0) varietyCount++;
          if (dailyStats.coinflipPlays > 0) varietyCount++;
          if (dailyStats.crashPlays > 0) varietyCount++;
          if (dailyStats.minesPlays > 0) varietyCount++;
          quest.progress = varietyCount;
          break;
        case 'casino_spent':
          quest.progress = dailyStats.casinoSpent;
          break;
        case 'big_win':
          quest.progress = userQuests.biggestSingleWin;
          break;
        case 'voice_5min':
          quest.progress = dailyStats.voiceMinutes >= 5 ? 1 : 0;
          break;
        case 'voice_15min':
          quest.progress = dailyStats.voiceMinutes >= 15 ? 1 : 0;
          break;
        case 'voice_30min':
          quest.progress = dailyStats.voiceMinutes >= 30 ? 1 : 0;
          break;
        case 'voice_1hour':
          quest.progress = dailyStats.voiceMinutes >= 60 ? 1 : 0;
          break;
        case 'voice_message_combo':
          quest.progress = (dailyStats.voiceMinutes >= 10 && dailyStats.messagesCount >= 5) ? 1 : 0;
          break;
        case 'hourly_messages':
          quest.progress = dailyStats.hourlyActivity.size;
          break;
      }

      if (quest.progress >= quest.target && !quest.completed) {
        quest.completed = true;
        await this.giveReward(userQuests.userId, quest.reward);
        Logger.success('Quest completed', { userId: userQuests.userId, questId: quest.id, reward: quest.reward });
      }
    }

    // Tüm günlük görevler tamamlandı mı kontrol et
    const allCompleted = userQuests.quests.every(q => q.completed);
    if (allCompleted && !userQuests.allDailyCompleted) {
      userQuests.allDailyCompleted = true;
      Logger.success('All daily quests completed! Special quest unlocked', { userId: userQuests.userId });
    }

    // Özel görevi güncelle (sadece günlük görevler tamamlandıysa)
    if (userQuests.allDailyCompleted && userQuests.specialQuest && !userQuests.specialQuest.completed) {
      const special = userQuests.specialQuest;
      
      switch (special.type) {
        case 'message_count':
          special.progress = dailyStats.messagesCount;
          break;
        case 'casino_spent':
          special.progress = dailyStats.casinoSpent;
          break;
        case 'voice_2hour':
          special.progress = dailyStats.voiceMinutes >= 120 ? 1 : 0;
          break;
        case 'replies':
          special.progress = dailyStats.repliesGiven.size;
          break;
        case 'slot_plays':
          special.progress = dailyStats.slotPlays;
          break;
        case 'blackjack_plays':
          special.progress = dailyStats.blackjackPlays;
          break;
        case 'casino_wins':
          special.progress = userQuests.casinoWins;
          break;
        case 'reaction_messages':
          special.progress = userQuests.reactionGivenToMessages.size;
          break;
        case 'fast_messages_3h':
          const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
          special.progress = userQuests.fastMessageTimestamps.filter(ts => ts >= threeHoursAgo).length;
          break;
      }

      if (special.progress >= special.target && !special.completed) {
        special.completed = true;
        await this.giveReward(userQuests.userId, special.reward);
        Logger.success('Special quest completed!', { userId: userQuests.userId, questId: special.id, reward: special.reward });
      }
    }
  }

  private async giveReward(userId: string, reward: number): Promise<void> {
    const player = await databaseService.getPlayer(userId);
    if (player) {
      player.balance += reward;
      await databaseService.updatePlayer(player);
    }
  }
}

export const questService = new QuestService();
