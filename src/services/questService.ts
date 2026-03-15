import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { databaseService } from './databaseService';
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
}

export interface UserQuests {
  userId: string;
  lastReset: string; // ISO date
  quests: Quest[];
  messageCount: number;
  voiceMinutes: number;
  voicePackets: number; // Ses paketleri (her 5 dakika = 1 paket)
  reactionsGiven: number;
  reactionsReceived: Map<string, number>; // messageId -> count
  mentionedUsers: Set<string>;
  emojisUsed: Set<string>;
  repliesReceived: Map<string, number>; // messageId -> count
  hourlyMessages: Set<number>; // hours (0-23)
  firstMessageToday: boolean;
  usedRastgele: boolean;
  reactionGivenToUsers: Set<string>; // Farklı kullanıcılara reaction tracking
  reactionGivenToMessages: Set<string>; // Farklı mesajlara reaction tracking
  nightMessageSent: boolean; // Gece mesajı gönderildi mi
  isFirstMessageInServer: boolean; // Sunucuda günün ilk mesajı mı
  isResetting: boolean; // Reset işlemi devam ediyor mu (race condition önleme)
  lastSaveTime: number; // Son kayıt zamanı (race condition önleme)
}

const ALL_QUESTS = [
  { id: 'chat_warm', emoji: '1️⃣', name: 'Sohbet Isındı', description: '10 mesaj gönder', reward: 20, target: 10, type: 'message' },
  { id: 'chat_engine', emoji: '2️⃣', name: 'Sohbet Motoru', description: '25 mesaj gönder', reward: 40, target: 25, type: 'message' },
  { id: 'voice_casual', emoji: '3️⃣', name: 'Ses Takılan', description: 'Ses kanalında 2 paket (10 dakika)', reward: 30, target: 2, type: 'voice' },
  { id: 'voice_long', emoji: '4️⃣', name: 'Uzun Sohbet', description: 'Ses kanalında 6 paket (30 dakika)', reward: 60, target: 6, type: 'voice' },
  { id: 'reaction_master', emoji: '5️⃣', name: 'Reaksiyon Ustası', description: '5 farklı mesaja reaction bırak', reward: 20, target: 5, type: 'reaction_give' },
  { id: 'popular_message', emoji: '6️⃣', name: 'Popüler Mesaj', description: 'Bir mesajın 3 reaction alsın', reward: 35, target: 3, type: 'reaction_receive' },
  { id: 'social_interaction', emoji: '7️⃣', name: 'İnsanlarla Etkileşim', description: '3 farklı kullanıcıyı mentionla', reward: 25, target: 3, type: 'mention' },
  { id: 'morning_crew', emoji: '8️⃣', name: 'Günaydın Ekibi', description: 'Bugün ilk mesajını gönder', reward: 50, target: 1, type: 'first_message' },
  { id: 'active_listener', emoji: '9️⃣', name: 'Aktif Dinleyici', description: '2 paket voice (10 dk) + 5 mesaj', reward: 45, target: 1, type: 'voice_message' },
  { id: 'emoji_lover', emoji: '🔟', name: 'Emoji Sever', description: '5 farklı emoji kullan', reward: 20, target: 5, type: 'emoji' },
  { id: 'helpful', emoji: '1️⃣1️⃣', name: 'Yardımsever', description: 'Bir mesajın 2 reply alsın', reward: 30, target: 2, type: 'reply_receive' },
  { id: 'night_owl', emoji: '1️⃣2️⃣', name: 'Gece Kuşu', description: '00:00 – 05:00 arasında mesaj gönder', reward: 40, target: 1, type: 'night_message' },
  { id: 'all_day_active', emoji: '1️⃣3️⃣', name: 'Gün Boyu Aktif', description: '3 farklı saat diliminde mesaj gönder', reward: 50, target: 3, type: 'hourly_message' },
  { id: 'community_member', emoji: '1️⃣4️⃣', name: 'Topluluk Üyesi', description: '5 farklı kullanıcının mesajına reaction ver', reward: 25, target: 5, type: 'reaction_users' },
  { id: 'lucky_day', emoji: '1️⃣5️⃣', name: 'Şanslı Gün', description: '/rastgele komutunu kullan', reward: 15, target: 1, type: 'rastgele' },
];

class QuestService {
  async getUserQuests(userId: string): Promise<UserQuests | null> {
    try {
      const docSnap = await getDoc(doc(db, 'userQuests', userId));
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        ...data,
        reactionsReceived: new Map(Object.entries(data.reactionsReceived || {})),
        mentionedUsers: new Set(data.mentionedUsers || []),
        emojisUsed: new Set(data.emojisUsed || []),
        repliesReceived: new Map(Object.entries(data.repliesReceived || {})),
        hourlyMessages: new Set(data.hourlyMessages || []),
        reactionGivenToUsers: new Set(data.reactionGivenToUsers || []),
        reactionGivenToMessages: new Set(data.reactionGivenToMessages || []),
      } as UserQuests;
    } catch (error) {
      Logger.error('getUserQuests error', error);
      return null;
    }
  }

  async initializeUserQuests(userId: string): Promise<UserQuests> {
    const randomQuests = this.getRandomQuests(5);
    const userQuests: UserQuests = {
      userId,
      lastReset: new Date().toISOString(),
      quests: randomQuests,
      messageCount: 0,
      voiceMinutes: 0,
      voicePackets: 0,
      reactionsGiven: 0,
      reactionsReceived: new Map(),
      mentionedUsers: new Set(),
      emojisUsed: new Set(),
      repliesReceived: new Map(),
      hourlyMessages: new Set(),
      firstMessageToday: false,
      usedRastgele: false,
      reactionGivenToUsers: new Set(),
      reactionGivenToMessages: new Set(),
      nightMessageSent: false,
      isFirstMessageInServer: false,
      isResetting: false,
      lastSaveTime: Date.now(),
    };

    await this.saveUserQuests(userQuests);
    return userQuests;
  }

  private getRandomQuests(count: number): Quest[] {
    const shuffled = [...ALL_QUESTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(q => ({
      ...q,
      progress: 0,
      completed: false,
    }));
  }

  async saveUserQuests(userQuests: UserQuests): Promise<void> {
    try {
      const data = {
        ...userQuests,
        reactionsReceived: Object.fromEntries(userQuests.reactionsReceived),
        mentionedUsers: Array.from(userQuests.mentionedUsers),
        emojisUsed: Array.from(userQuests.emojisUsed),
        repliesReceived: Object.fromEntries(userQuests.repliesReceived),
        hourlyMessages: Array.from(userQuests.hourlyMessages),
        reactionGivenToUsers: Array.from(userQuests.reactionGivenToUsers),
        reactionGivenToMessages: Array.from(userQuests.reactionGivenToMessages),
      };
      
      // Timeout ile setDoc
      await Promise.race([
        setDoc(doc(db, 'userQuests', userQuests.userId), data),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 5000))
      ]);
    } catch (error) {
      Logger.error('saveUserQuests error', error);
      // Hata olsa bile devam et
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
    // Async olarak çalıştır, await etme
    this.trackMessageAsync(userId, message).catch(error => {
      Logger.error('trackMessage async error', error);
    });
  }

  private async trackMessageAsync(userId: string, message: any): Promise<void> {
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    const resetOccurred = await this.checkAndResetDaily(userId);
    if (resetOccurred) {
      // Reset olduysa yeni veriyi çek
      userQuests = await this.getUserQuests(userId);
      if (!userQuests) return;
    }

    userQuests.messageCount++;
    
    // İlk mesaj kontrolü (kullanıcının günün ilk mesajı)
    if (!userQuests.firstMessageToday) {
      userQuests.firstMessageToday = true;
    }

    // Saat dilimi takibi
    const hour = new Date().getHours();
    userQuests.hourlyMessages.add(hour);

    // Gece mesajı kontrolü (00:00 - 05:00)
    if (hour >= 0 && hour < 5 && !userQuests.nightMessageSent) {
      userQuests.nightMessageSent = true;
    }

    // Mention takibi
    if (message.mentions?.users) {
      message.mentions.users.forEach((user: any) => {
        if (user.id !== userId && !user.bot) {
          userQuests.mentionedUsers.add(user.id);
        }
      });
    }

    // Geliştirilmiş Emoji takibi
    const emojiRegex = /<a?:[\w_]+:\d+>|[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = message.content?.match(emojiRegex);
    if (emojis) {
      emojis.forEach((emoji: string) => userQuests.emojisUsed.add(emoji));
    }

    await this.updateQuestProgress(userQuests);
    userQuests.lastSaveTime = Date.now();
    await this.saveUserQuests(userQuests);
  }

  async trackVoice(userId: string, minutes: number): Promise<void> {
    this.trackVoiceAsync(userId, minutes).catch(error => {
      Logger.error('trackVoice async error', error);
    });
  }

  private async trackVoiceAsync(userId: string, minutes: number): Promise<void> {
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    const resetOccurred = await this.checkAndResetDaily(userId);
    if (resetOccurred) {
      userQuests = await this.getUserQuests(userId);
      if (!userQuests) return;
    }
    
    userQuests.voiceMinutes += minutes;
    // Her 5 dakika = 1 paket
    userQuests.voicePackets = Math.floor(userQuests.voiceMinutes / 5);

    await this.updateQuestProgress(userQuests);
    userQuests.lastSaveTime = Date.now();
    await this.saveUserQuests(userQuests);
  }

  async trackReactionGiven(userId: string, messageId: string, messageAuthorId?: string): Promise<void> {
    this.trackReactionGivenAsync(userId, messageId, messageAuthorId).catch(error => {
      Logger.error('trackReactionGiven async error', error);
    });
  }

  private async trackReactionGivenAsync(userId: string, messageId: string, messageAuthorId?: string): Promise<void> {
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    const resetOccurred = await this.checkAndResetDaily(userId);
    if (resetOccurred) {
      userQuests = await this.getUserQuests(userId);
      if (!userQuests) return;
    }
    
    userQuests.reactionsGiven++;
    
    // Farklı mesajlara reaction tracking
    userQuests.reactionGivenToMessages.add(messageId);
    
    // Farklı kullanıcılara reaction tracking
    if (messageAuthorId && messageAuthorId !== userId) {
      userQuests.reactionGivenToUsers.add(messageAuthorId);
      Logger.info('Reaction to user tracked', { 
        userId, 
        targetUserId: messageAuthorId,
        totalUniqueUsers: userQuests.reactionGivenToUsers.size 
      });
    }

    await this.updateQuestProgress(userQuests);
    userQuests.lastSaveTime = Date.now();
    await this.saveUserQuests(userQuests);
  }

  async trackReactionReceived(userId: string, messageId: string): Promise<void> {
    this.trackReactionReceivedAsync(userId, messageId).catch(error => {
      Logger.error('trackReactionReceived async error', error);
    });
  }

  private async trackReactionReceivedAsync(userId: string, messageId: string): Promise<void> {
    let userQuests = await this.getUserQuests(userId);
    if (!userQuests) {
      userQuests = await this.initializeUserQuests(userId);
    }

    const resetOccurred = await this.checkAndResetDaily(userId);
    if (resetOccurred) {
      userQuests = await this.getUserQuests(userId);
      if (!userQuests) return;
    }
    
    const current = userQuests.reactionsReceived.get(messageId) || 0;
    userQuests.reactionsReceived.set(messageId, current + 1);

    await this.updateQuestProgress(userQuests);
    userQuests.lastSaveTime = Date.now();
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
    userQuests.lastSaveTime = Date.now();
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
    
    userQuests.usedRastgele = true;

    await this.updateQuestProgress(userQuests);
    userQuests.lastSaveTime = Date.now();
    await this.saveUserQuests(userQuests);
  }

  private async updateQuestProgress(userQuests: UserQuests): Promise<void> {
    for (const quest of userQuests.quests) {
      if (quest.completed) continue;

      switch (quest.id) {
        case 'chat_warm':
        case 'chat_engine':
          quest.progress = userQuests.messageCount;
          break;
        case 'voice_casual':
        case 'voice_long':
          // Paket sayısı ile takip (1 paket = 5 dakika)
          quest.progress = userQuests.voicePackets;
          break;
        case 'reaction_master':
          // 5 farklı mesaja reaction bırak
          quest.progress = userQuests.reactionGivenToMessages.size;
          break;
        case 'popular_message':
          // Bir mesajın 3 reaction alması - DÜZELTILDI!
          quest.progress = userQuests.reactionsReceived.size > 0 
            ? Math.max(...Array.from(userQuests.reactionsReceived.values())) 
            : 0;
          break;
        case 'social_interaction':
          // 3 farklı kullanıcıyı mentionla
          quest.progress = userQuests.mentionedUsers.size;
          break;
        case 'morning_crew':
          // Günün ilk mesajını gönder (kullanıcının günün ilk mesajı)
          quest.progress = userQuests.firstMessageToday ? 1 : 0;
          break;
        case 'active_listener':
          // 2 paket voice (10 dk) + 5 mesaj
          quest.progress = (userQuests.voicePackets >= 2 && userQuests.messageCount >= 5) ? 1 : 0;
          break;
        case 'emoji_lover':
          // 5 farklı emoji kullan
          quest.progress = userQuests.emojisUsed.size;
          break;
        case 'helpful':
          // Bir mesajın 2 reply alması - DÜZELTILDI!
          quest.progress = userQuests.repliesReceived.size > 0 
            ? Math.max(...Array.from(userQuests.repliesReceived.values())) 
            : 0;
          break;
        case 'night_owl':
          // 00:00 – 05:00 arasında mesaj gönder
          quest.progress = userQuests.nightMessageSent ? 1 : 0;
          break;
        case 'all_day_active':
          // 3 farklı saat diliminde mesaj gönder
          quest.progress = userQuests.hourlyMessages.size;
          break;
        case 'community_member':
          // 5 farklı kullanıcının mesajına reaction ver
          quest.progress = userQuests.reactionGivenToUsers.size;
          break;
        case 'lucky_day':
          // /rastgele komutunu kullan
          quest.progress = userQuests.usedRastgele ? 1 : 0;
          break;
      }

      if (quest.progress >= quest.target && !quest.completed) {
        quest.completed = true;
        await this.giveReward(userQuests.userId, quest.reward);
        Logger.success('Quest completed', { userId: userQuests.userId, questId: quest.id, reward: quest.reward });
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
