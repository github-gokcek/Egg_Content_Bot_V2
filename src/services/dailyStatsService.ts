import { db } from './firebase';
import { monitoredGetDoc, monitoredUpdateDoc, doc } from './monitoredFirebase';
import { DailyStats, TotalStats } from '../types';
import { Logger } from '../utils/logger';
import { CachedFieldUpdater } from './batchingUtil';

const ISTANBUL_OFFSET = 3 * 60 * 60 * 1000; // UTC+3
const CACHE_TTL = 30000; // 30 seconds

function getIstanbulDate(): string {
  const now = new Date(Date.now() + ISTANBUL_OFFSET);
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function createEmptyDailyStats(): DailyStats {
  return {
    date: getIstanbulDate(),
    lastReset: new Date(),
    slotPlays: 0,
    coinflipPlays: 0,
    crashPlays: 0,
    blackjackPlays: 0,
    minesPlays: 0,
    casinoWins: 0,
    casinoSpent: 0,
    voiceMinutes: 0,
    messagesCount: 0,
    reactionsGiven: 0,
    reactionsReceived: 0,
    mentionsGiven: new Set(),
    repliesGiven: new Set(),
    emojisUsed: new Set(),
    channelsUsed: new Set(),
    hourlyActivity: new Set()
  };
}

export class DailyStatsService {
  private cache = new CachedFieldUpdater(); // In-memory cache for daily stats

  async getDailyStats(userId: string): Promise<DailyStats> {
    try {
      // Check cache first
      const cached = this.cache.get(`dailyStats_${userId}`);
      if (cached) {
        Logger.debug('Daily stats from cache', { userId });
        return cached;
      }

      const userDoc = await monitoredGetDoc(doc(db, 'players', userId));
      if (!userDoc.exists()) {
        const empty = createEmptyDailyStats();
        this.cache.set(`dailyStats_${userId}`, empty);
        return empty;
      }

      const data = userDoc.data();
      const dailyStats = data.dailyStats;
      
      if (!dailyStats || dailyStats.date !== getIstanbulDate()) {
        const empty = createEmptyDailyStats();
        this.cache.set(`dailyStats_${userId}`, empty);
        return empty;
      }

      const stats = {
        ...dailyStats,
        mentionsGiven: new Set(dailyStats.mentionsGiven || []),
        repliesGiven: new Set(dailyStats.repliesGiven || []),
        emojisUsed: new Set(dailyStats.emojisUsed || []),
        channelsUsed: new Set(dailyStats.channelsUsed || []),
        hourlyActivity: new Set(dailyStats.hourlyActivity || [])
      };

      // Cache it
      this.cache.set(`dailyStats_${userId}`, stats);
      return stats;
    } catch (error) {
      Logger.error('Daily stats getirilemedi', error);
      const empty = createEmptyDailyStats();
      this.cache.set(`dailyStats_${userId}`, empty);
      return empty;
    }
  }

  async updateDailyStats(userId: string, updates: Partial<DailyStats>): Promise<void> {
    try {
      const currentStats = await this.getDailyStats(userId);
      const merged = { ...currentStats, ...updates };

      const forFirebase = {
        ...merged,
        mentionsGiven: Array.from(merged.mentionsGiven),
        repliesGiven: Array.from(merged.repliesGiven),
        emojisUsed: Array.from(merged.emojisUsed),
        channelsUsed: Array.from(merged.channelsUsed),
        hourlyActivity: Array.from(merged.hourlyActivity)
      };

      await monitoredUpdateDoc(doc(db, 'players', userId), {
        dailyStats: forFirebase
      });

      // Update cache after successful write
      this.cache.set(`dailyStats_${userId}`, merged);
    } catch (error) {
      // Log error but don't crash - quota issues are temporary
      if (error instanceof Error && error.message.includes('RESOURCE_EXHAUSTED')) {
        // Quietly handle quota exceeded - data will be retried later
        // Update cache anyway for local tracking
        this.cache.set(`dailyStats_${userId}`, {
          ...await this.getDailyStats(userId),
          ...updates
        });
      } else {
        Logger.warn('Daily stats update failed', error instanceof Error ? error.message : error);
        // Invalidate cache on other errors to force fresh read next time
        this.cache.invalidate(`dailyStats_${userId}`);
      }
    }
  }

  async incrementCasinoPlay(userId: string, gameType: 'slot' | 'coinflip' | 'crash' | 'blackjack' | 'mines'): Promise<void> {
    const stats = await this.getDailyStats(userId);
    const field = `${gameType}Plays` as keyof DailyStats;
    stats[field] = (stats[field] as number) + 1;
    await this.updateDailyStats(userId, stats);
  }

  async incrementCasinoWin(userId: string): Promise<void> {
    const stats = await this.getDailyStats(userId);
    stats.casinoWins += 1;
    await this.updateDailyStats(userId, stats);
  }

  async incrementCasinoSpent(userId: string, amount: number): Promise<void> {
    const stats = await this.getDailyStats(userId);
    stats.casinoSpent += amount;
    await this.updateDailyStats(userId, stats);
  }

  async incrementVoiceMinutes(userId: string, minutes: number): Promise<void> {
    const stats = await this.getDailyStats(userId);
    stats.voiceMinutes += minutes;
    await this.updateDailyStats(userId, stats);
    
    await this.incrementTotalVoiceMinutes(userId, minutes);
  }

  async incrementMessage(userId: string, channelId: string): Promise<void> {
    const stats = await this.getDailyStats(userId);
    stats.messagesCount += 1;
    stats.channelsUsed.add(channelId);
    
    const istanbulHour = new Date(Date.now() + ISTANBUL_OFFSET).getUTCHours();
    stats.hourlyActivity.add(istanbulHour);
    
    await this.updateDailyStats(userId, stats);
  }

  async addMention(userId: string, mentionedUserId: string): Promise<void> {
    const stats = await this.getDailyStats(userId);
    stats.mentionsGiven.add(mentionedUserId);
    await this.updateDailyStats(userId, stats);
  }

  async addReply(userId: string, repliedUserId: string): Promise<void> {
    const stats = await this.getDailyStats(userId);
    stats.repliesGiven.add(repliedUserId);
    await this.updateDailyStats(userId, stats);
  }

  async addEmoji(userId: string, emojiName: string): Promise<void> {
    const stats = await this.getDailyStats(userId);
    stats.emojisUsed.add(emojiName);
    await this.updateDailyStats(userId, stats);
  }

  async incrementReactionGiven(userId: string): Promise<void> {
    const stats = await this.getDailyStats(userId);
    stats.reactionsGiven += 1;
    await this.updateDailyStats(userId, stats);
  }

  async incrementReactionReceived(userId: string): Promise<void> {
    const stats = await this.getDailyStats(userId);
    stats.reactionsReceived += 1;
    await this.updateDailyStats(userId, stats);
  }

  async getTotalStats(userId: string): Promise<TotalStats> {
    try {
      const userDoc = await monitoredGetDoc(doc(db, 'players', userId));
      if (!userDoc.exists()) {
        return { voiceMinutesTotal: 0, casinoWinsTotal: 0 };
      }

      const data = userDoc.data();
      return data.totalStats || { voiceMinutesTotal: 0, casinoWinsTotal: 0 };
    } catch (error) {
      Logger.error('Total stats getirilemedi', error);
      return { voiceMinutesTotal: 0, casinoWinsTotal: 0 };
    }
  }

  async incrementTotalVoiceMinutes(userId: string, minutes: number): Promise<void> {
    try {
      const totalStats = await this.getTotalStats(userId);
      totalStats.voiceMinutesTotal += minutes;
      
      await monitoredUpdateDoc(doc(db, 'players', userId), {
        totalStats
      });
    } catch (error) {
      Logger.error('Total voice minutes güncellenemedi', error);
    }
  }

  async incrementTotalCasinoWins(userId: string): Promise<void> {
    try {
      const totalStats = await this.getTotalStats(userId);
      totalStats.casinoWinsTotal += 1;
      
      await monitoredUpdateDoc(doc(db, 'players', userId), {
        totalStats
      });
    } catch (error) {
      Logger.error('Total casino wins güncellenemedi', error);
    }
  }

  async resetDailyStats(userId: string): Promise<void> {
    try {
      const emptyStats = createEmptyDailyStats();
      const forFirebase = {
        ...emptyStats,
        mentionsGiven: [],
        repliesGiven: [],
        emojisUsed: [],
        channelsUsed: [],
        hourlyActivity: []
      };

      await monitoredUpdateDoc(doc(db, 'players', userId), {
        dailyStats: forFirebase
      });
      
      // Clear cache for this user
      this.cache.invalidate(`dailyStats_${userId}`);
      
      Logger.info(`Daily stats sıfırlandı: ${userId}`);
    } catch (error) {
      Logger.error('Daily stats sıfırlanamadı', error);
      // Invalidate cache on error
      this.cache.invalidate(`dailyStats_${userId}`);
    }
  }

  /**
   * Clear all cached data (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
    Logger.debug('Daily stats cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return this.cache.get('_stats') || { cacheSize: 0 };
  }
}

export const dailyStatsService = new DailyStatsService();
