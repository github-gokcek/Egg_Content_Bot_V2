import { VoiceState } from 'discord.js';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { factionService } from './factionService';
import { FP_RATES } from '../types/faction';
import { Logger } from '../utils/logger';

interface VoiceSession {
  userId: string;
  joinedAt: Date;
  lastFPAward: Date;
  dailyFPEarned: number;
}

class VoiceActivityService {
  private checkInterval: NodeJS.Timeout | null = null;

  start() {
    this.checkInterval = setInterval(() => {
      this.checkSessions();
    }, 10 * 60 * 1000);
    
    Logger.info('Voice activity tracking başlatıldı');
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
      const now = new Date();
      const session: VoiceSession = {
        userId,
        joinedAt: now,
        lastFPAward: now,
        dailyFPEarned: 0,
      };
      await setDoc(doc(db, 'voiceSessions', userId), session);
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
      const now = new Date();
      
      for (const docSnap of snapshot.docs) {
        const session = docSnap.data() as VoiceSession;
        const userId = session.userId;

        const timeSinceLastAward = now.getTime() - new Date(session.lastFPAward).getTime();
        const minutesSinceLastAward = timeSinceLastAward / (1000 * 60);

        if (minutesSinceLastAward >= 10) {
          if (session.dailyFPEarned >= FP_RATES.VOICE_DAILY_CAP) {
            Logger.info('Voice FP günlük limite ulaşıldı', { userId, dailyFP: session.dailyFPEarned });
            continue;
          }

          const success = await factionService.awardFP(
            userId, 
            FP_RATES.VOICE_ACTIVITY_PER_10MIN, 
            'voice_activity',
            { duration: '10min' }
          );

          if (success) {
            await updateDoc(doc(db, 'voiceSessions', userId), {
              lastFPAward: now,
              dailyFPEarned: session.dailyFPEarned + FP_RATES.VOICE_ACTIVITY_PER_10MIN,
            });
            Logger.success('Voice FP verildi', { 
              userId, 
              amount: FP_RATES.VOICE_ACTIVITY_PER_10MIN,
              dailyTotal: session.dailyFPEarned + FP_RATES.VOICE_ACTIVITY_PER_10MIN
            });
          }
        }
      }
    } catch (error) {
      Logger.error('checkSessions error', error);
    }
  }

  async resetDailyFP() {
    try {
      const snapshot = await getDocs(collection(db, 'voiceSessions'));
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'voiceSessions', docSnap.id), {
          dailyFPEarned: 0,
        });
      }
      Logger.success('Voice günlük FP sıfırlandı');
    } catch (error) {
      Logger.error('resetDailyFP error', error);
    }
  }
}

export const voiceActivityService = new VoiceActivityService();
