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
      
      // Firebase'e tarih objelerini ISO string olarak kaydet
      await setDoc(doc(db, 'voiceSessions', userId), {
        userId: userId,
        joinedAt: now.toISOString(),
        lastPacketTime: now.toISOString(), // İlk paket için başlangıç zamanı
        dailyPackets: 0,
        dailyFPEarned: 0,
      });
      
      Logger.info('Voice session başladı', { userId, startTime: now.toISOString() });
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
      
      Logger.info('Checking voice sessions', { totalSessions: snapshot.docs.length });
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const userId = data.userId;

        // Tarih dönüşümü - Firebase'den string olarak geliyor
        const lastPacketTime = data.lastPacketTime ? new Date(data.lastPacketTime) : new Date();
        const joinedAt = data.joinedAt ? new Date(data.joinedAt) : new Date();
        
        // 5 dakika paket kontrolü
        const timeSinceLastPacket = now.getTime() - lastPacketTime.getTime();
        
        Logger.info('Session check', { 
          userId, 
          timeSinceLastPacket: Math.floor(timeSinceLastPacket / 1000), 
          packetDuration: this.PACKET_DURATION / 1000,
          dailyPackets: data.dailyPackets || 0,
          lastPacketTimeStr: data.lastPacketTime
        });
        
        if (timeSinceLastPacket >= this.PACKET_DURATION) {
          // Kaç paket tamamlandığını hesapla
          const completedPackets = Math.floor(timeSinceLastPacket / this.PACKET_DURATION);
          const dailyFPEarned = data.dailyFPEarned || 0;
          const newFPEarned = dailyFPEarned + (completedPackets * FP_RATES.VOICE_ACTIVITY_PER_10MIN);

          // Günlük limite kontrol et
          if (newFPEarned > FP_RATES.VOICE_DAILY_CAP) {
            Logger.info('Voice FP günlük limite ulaşıldı', { userId, dailyFP: dailyFPEarned });
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
              lastPacketTime: now.toISOString(),
              dailyPackets: (data.dailyPackets || 0) + completedPackets,
              dailyFPEarned: newFPEarned,
            });
            
            // Quest tracking - dakika olarak gönder
            try {
              await questService.trackVoice(userId, completedPackets * 5);
              Logger.success('Voice quest tracked', { userId, minutes: completedPackets * 5 });
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
