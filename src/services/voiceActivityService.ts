import { VoiceState } from 'discord.js';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { factionService } from './factionService';
import { FP_RATES } from '../types/faction';
import { Logger } from '../utils/logger';
import { questService } from './questService';

interface VoiceSession {
  userId: string;
  joinedAt: Date;
  lastPacketTime: Date; // Son paket kaydedilme zamanı
  dailyPackets: number; // Bugün kaç paket aldığı
  dailyFPEarned: number;
}

class VoiceActivityService {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly PACKET_DURATION = 5 * 60 * 1000; // 5 dakika

  start() {
    this.checkInterval = setInterval(() => {
      this.checkSessions();
    }, 1 * 60 * 1000); // Her 1 dakikada kontrol et
    
    Logger.info('Voice activity tracking başlatıldı (5 dakika paket sistemi)');
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
        lastPacketTime: now,
        dailyPackets: 0,
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

        // 5 dakika paket kontrolü
        const timeSinceLastPacket = now.getTime() - new Date(session.lastPacketTime).getTime();
        
        if (timeSinceLastPacket >= this.PACKET_DURATION) {
          // Kaç paket tamamlandığını hesapla
          const completedPackets = Math.floor(timeSinceLastPacket / this.PACKET_DURATION);
          const newFPEarned = session.dailyFPEarned + (completedPackets * FP_RATES.VOICE_ACTIVITY_PER_10MIN);

          // Günlük limite kontrol et
          if (newFPEarned > FP_RATES.VOICE_DAILY_CAP) {
            Logger.info('Voice FP günlük limite ulaşıldı', { userId, dailyFP: session.dailyFPEarned });
            continue;
          }

          // FP ver
          const success = await factionService.awardFP(
            userId, 
            completedPackets * FP_RATES.VOICE_ACTIVITY_PER_10MIN, 
            'voice_activity',
            { duration: `${completedPackets * 5}min`, packets: completedPackets }
          );

          if (success) {
            await updateDoc(doc(db, 'voiceSessions', userId), {
              lastPacketTime: now,
              dailyPackets: session.dailyPackets + completedPackets,
              dailyFPEarned: newFPEarned,
            });
            
            // Quest tracking - paket sayısı ile
            try {
              await questService.trackVoice(userId, completedPackets * 5);
            } catch (error) {
              Logger.error('Quest voice tracking error', error);
            }
            
            Logger.success('Voice FP paketleri verildi', { 
              userId, 
              packets: completedPackets,
              fpPerPacket: FP_RATES.VOICE_ACTIVITY_PER_10MIN,
              totalFP: completedPackets * FP_RATES.VOICE_ACTIVITY_PER_10MIN,
              dailyTotal: newFPEarned
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
          dailyPackets: 0,
          dailyFPEarned: 0,
        });
      }
      Logger.success('Voice günlük FP paketleri sıfırlandı');
    } catch (error) {
      Logger.error('resetDailyFP error', error);
    }
  }
}

export const voiceActivityService = new VoiceActivityService();
