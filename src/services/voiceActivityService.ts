import { VoiceState } from 'discord.js';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { factionService } from './factionService';
import { FP_RATES } from '../types/faction';
import { Logger } from '../utils/logger';
import { questService } from './questService';

interface VoiceSession {
  userId: string;
  joinedAt: number; // Timestamp (ms)
  totalSeconds: number; // Toplam saniye (günlük)
}

class VoiceActivityService {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 2 * 60 * 1000; // 2 dakika (Firebase quota için)

  start() {
    // Bot başlatıldığında eski sessionları temizle
    this.cleanupStaleSessions();
    
    this.checkInterval = setInterval(() => {
      this.checkSessions();
    }, this.CHECK_INTERVAL);
    
    Logger.info('Voice activity tracking başlatıldı (saniye bazlı)');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    const userId = newState.id;

    if (!oldState.channelId && newState.channelId) {
      await this.startSession(userId);
    }
    else if (oldState.channelId && !newState.channelId) {
      await this.endSession(userId);
    }
  }

  private async startSession(userId: string) {
    try {
      const now = Date.now();
      
      await setDoc(doc(db, 'voiceSessions', userId), {
        userId: userId,
        joinedAt: now,
        totalSeconds: 0,
      });
      
      Logger.info('Voice session başladı', { userId });
    } catch (error) {
      Logger.error('startSession error', error);
    }
  }

  private async endSession(userId: string) {
    try {
      await deleteDoc(doc(db, 'voiceSessions', userId));
      Logger.info('Voice session bitti', { userId });
    } catch (error) {
      Logger.error('endSession error', error);
    }
  }

  private async checkSessions() {
    try {
      const snapshot = await getDocs(collection(db, 'voiceSessions'));
      const now = Date.now();
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const userId = data.userId;
        const joinedAt = data.joinedAt || now;
        const totalSeconds = data.totalSeconds || 0;
        
        // Geçen süreyi hesapla (saniye)
        const elapsedSeconds = Math.floor((now - joinedAt) / 1000);
        
        if (elapsedSeconds >= 120) { // En az 2 dakika (Firebase quota için)
          // Toplam süreyi güncelle
          const newTotalSeconds = totalSeconds + elapsedSeconds;
          
          await updateDoc(doc(db, 'voiceSessions', userId), {
            joinedAt: now, // Yeni başlangıç noktası
            totalSeconds: newTotalSeconds,
          });
          
          // Quest tracking - HER ZAMAN gönder (saniye olarak)
          // questService içinde dakikaya çevrilecek
          try {
            const totalMinutes = Math.floor(newTotalSeconds / 60);
            await questService.trackVoice(userId, totalMinutes);
            Logger.success('Voice tracked', { 
              userId, 
              elapsedSeconds, 
              totalSeconds: newTotalSeconds,
              totalMinutes
            });
          } catch (error) {
            Logger.error('Quest voice tracking error', error);
          }
          
          // FP ver (her 10 dakika)
          const fpMinutes = Math.floor(newTotalSeconds / 60);
          const fpToGive = Math.floor(fpMinutes / 10) * FP_RATES.VOICE_ACTIVITY_PER_10MIN;
          
          if (fpToGive > 0) {
            await factionService.awardFP(
              userId, 
              fpToGive, 
              'voice_activity',
              { totalMinutes: Math.floor(newTotalSeconds / 60) }
            );
          }
        }
      }
    } catch (error) {
      Logger.error('checkSessions error', error);
    }
  }

  async resetDailyVoice() {
    try {
      const snapshot = await getDocs(collection(db, 'voiceSessions'));
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const userId = data.userId;
        
        // CRITICAL FIX: Reset öncesi son kez quest tracking yap
        const totalSeconds = data.totalSeconds || 0;
        const totalMinutes = Math.floor(totalSeconds / 60);
        
        if (totalMinutes > 0) {
          try {
            await questService.trackVoice(userId, totalMinutes);
            Logger.info('Final voice track before reset', { userId, totalMinutes });
          } catch (error) {
            Logger.error('Final voice tracking error', error);
          }
        }
        
        // Şimdi sıfırla
        await updateDoc(doc(db, 'voiceSessions', docSnap.id), {
          totalSeconds: 0,
          joinedAt: Date.now(), // Yeni başlangıç noktası
        });
      }
      Logger.success('Voice günlük süreler sıfırlandı');
    } catch (error) {
      Logger.error('resetDailyVoice error', error);
    }
  }
  
  async getUserVoiceTime(userId: string): Promise<number> {
    try {
      const docSnap = await getDoc(doc(db, 'voiceSessions', userId));
      if (!docSnap.exists()) return 0;
      
      const data = docSnap.data();
      const totalSeconds = data.totalSeconds || 0;
      const joinedAt = data.joinedAt || Date.now();
      const currentSeconds = Math.floor((Date.now() - joinedAt) / 1000);
      
      return totalSeconds + currentSeconds;
    } catch (error) {
      Logger.error('getUserVoiceTime error', error);
      return 0;
    }
  }
  
  private async cleanupStaleSessions() {
    try {
      const snapshot = await getDocs(collection(db, 'voiceSessions'));
      const now = Date.now();
      const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 saat
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const joinedAt = data.joinedAt || now;
        
        // 24 saatten eski sessionları temizle (bot offline olmuş olabilir)
        if (now - joinedAt > STALE_THRESHOLD) {
          Logger.warn('Stale voice session cleaned', { userId: data.userId, age: Math.floor((now - joinedAt) / 1000 / 60) + ' minutes' });
          await deleteDoc(doc(db, 'voiceSessions', docSnap.id));
        }
      }
      
      Logger.info('Stale voice sessions cleanup completed');
    } catch (error) {
      Logger.error('cleanupStaleSessions error', error);
    }
  }
}

export const voiceActivityService = new VoiceActivityService();
