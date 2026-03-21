import { VoiceState } from 'discord.js';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { factionService } from './factionService';
import { FP_RATES } from '../types/faction';
import { Logger } from '../utils/logger';
import { questService } from './questService';

interface VoiceSession {
  userId: string;
  joinedAt: number;
  totalSeconds: number;
}

class VoiceActivityService {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 2 * 60 * 1000; // 2 dakika
  private activeSessions: Map<string, { joinedAt: number; totalSeconds: number }> = new Map();

  start() {
    this.loadActiveSessions();
    
    this.checkInterval = setInterval(() => {
      this.checkSessions();
    }, this.CHECK_INTERVAL);
    
    Logger.info('Voice activity tracking başlatıldı (memory cache ile)');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async loadActiveSessions() {
    try {
      const snapshot = await getDocs(collection(db, 'voiceSessions'));
      const now = Date.now();
      const STALE_THRESHOLD = 24 * 60 * 60 * 1000;
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const joinedAt = data.joinedAt || now;
        
        if (now - joinedAt > STALE_THRESHOLD) {
          await deleteDoc(doc(db, 'voiceSessions', docSnap.id));
          Logger.warn('Stale session cleaned', { userId: data.userId });
        } else {
          this.activeSessions.set(data.userId, {
            joinedAt: data.joinedAt || now,
            totalSeconds: data.totalSeconds || 0
          });
        }
      }
      
      Logger.info('Active voice sessions loaded', { count: this.activeSessions.size });
    } catch (error) {
      Logger.error('loadActiveSessions error', error);
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
      
      this.activeSessions.set(userId, {
        joinedAt: now,
        totalSeconds: 0
      });
      
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
      this.activeSessions.delete(userId);
      await deleteDoc(doc(db, 'voiceSessions', userId));
      Logger.info('Voice session bitti', { userId });
    } catch (error) {
      Logger.error('endSession error', error);
    }
  }

  private async checkSessions() {
    try {
      const now = Date.now();
      
      // Memory'deki aktif sessionları kontrol et (Firebase'den okuma YOK!)
      for (const [userId, session] of this.activeSessions.entries()) {
        const elapsedSeconds = Math.floor((now - session.joinedAt) / 1000);
        
        if (elapsedSeconds >= 120) {
          const newTotalSeconds = session.totalSeconds + elapsedSeconds;
          
          // Memory'yi güncelle
          this.activeSessions.set(userId, {
            joinedAt: now,
            totalSeconds: newTotalSeconds
          });
          
          // Firebase'e kaydet (sadece 1 write)
          await updateDoc(doc(db, 'voiceSessions', userId), {
            joinedAt: now,
            totalSeconds: newTotalSeconds,
          });
          
          // Quest tracking
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
          
          // FP ver
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
      // Memory'deki sessionları sıfırla
      for (const [userId, session] of this.activeSessions.entries()) {
        const totalMinutes = Math.floor(session.totalSeconds / 60);
        
        if (totalMinutes > 0) {
          try {
            await questService.trackVoice(userId, totalMinutes);
            Logger.info('Final voice track before reset', { userId, totalMinutes });
          } catch (error) {
            Logger.error('Final voice tracking error', error);
          }
        }
        
        // Memory'de sıfırla
        this.activeSessions.set(userId, {
          joinedAt: Date.now(),
          totalSeconds: 0
        });
        
        // Firebase'e kaydet
        await updateDoc(doc(db, 'voiceSessions', userId), {
          totalSeconds: 0,
          joinedAt: Date.now(),
        });
      }
      
      Logger.success('Voice günlük süreler sıfırlandı');
    } catch (error) {
      Logger.error('resetDailyVoice error', error);
    }
  }
  
  async getUserVoiceTime(userId: string): Promise<number> {
    try {
      // Önce memory'den kontrol et
      const session = this.activeSessions.get(userId);
      if (session) {
        const currentSeconds = Math.floor((Date.now() - session.joinedAt) / 1000);
        return session.totalSeconds + currentSeconds;
      }
      
      // Memory'de yoksa Firebase'den oku
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
}

export const voiceActivityService = new VoiceActivityService();
