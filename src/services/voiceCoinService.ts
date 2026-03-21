import { VoiceState } from 'discord.js';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { databaseService } from './databaseService';
import { Logger } from '../utils/logger';

interface VoiceCoinSession {
  userId: string;
  joinedAt: Date;
  lastPacketTime: Date;
  dailyPackets: number;
  lastResetDate: string;
}

class VoiceCoinService {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly PACKET_DURATION = 5 * 60 * 1000; // 5 dakika
  private activeSessions: Map<string, VoiceCoinSession> = new Map();

  start() {
    this.loadActiveSessions();
    
    this.checkInterval = setInterval(() => {
      this.checkSessions();
    }, 1 * 60 * 1000); // Her 1 dakikada kontrol et
    
    Logger.info('Voice coin tracking başlatıldı (memory cache ile)');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async loadActiveSessions() {
    try {
      const snapshot = await getDocs(collection(db, 'voiceCoinSessions'));
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as VoiceCoinSession;
        this.activeSessions.set(data.userId, data);
      }
      
      Logger.info('Active voice coin sessions loaded', { count: this.activeSessions.size });
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
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const existingSession = this.activeSessions.get(userId);
      
      let session: VoiceCoinSession;
      
      if (existingSession && existingSession.lastResetDate === today) {
        session = existingSession;
      } else {
        session = {
          userId,
          joinedAt: now,
          lastPacketTime: now,
          dailyPackets: 0,
          lastResetDate: today,
        };
      }
      
      this.activeSessions.set(userId, session);
      await setDoc(doc(db, 'voiceCoinSessions', userId), session);
      
      Logger.info('Voice coin session başladı', { userId });
    } catch (error) {
      Logger.error('startSession error', error);
    }
  }

  private async endSession(userId: string) {
    try {
      this.activeSessions.delete(userId);
      await deleteDoc(doc(db, 'voiceCoinSessions', userId));
      Logger.info('Voice coin session bitti', { userId });
    } catch (error) {
      Logger.error('endSession error', error);
    }
  }

  private calculateCoinReward(packetCount: number): number {
    if (packetCount === 1) return 40;
    if (packetCount === 2) return 20;
    if (packetCount === 3) return 10;
    if (packetCount === 4) return 5;
    return 1;
  }

  private async checkSessions() {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Memory'deki aktif sessionları kontrol et (Firebase'den okuma YOK!)
      for (const [userId, session] of this.activeSessions.entries()) {
        // Gün değişmişse sıfırla
        if (session.lastResetDate !== today) {
          session.dailyPackets = 0;
          session.lastResetDate = today;
          session.lastPacketTime = now;
          
          this.activeSessions.set(userId, session);
          await updateDoc(doc(db, 'voiceCoinSessions', userId), {
            dailyPackets: 0,
            lastResetDate: today,
            lastPacketTime: now,
          });
          continue;
        }

        // 5 dakika paket kontrolü
        const timeSinceLastPacket = now.getTime() - new Date(session.lastPacketTime).getTime();
        
        if (timeSinceLastPacket >= this.PACKET_DURATION) {
          const completedPackets = Math.floor(timeSinceLastPacket / this.PACKET_DURATION);
          const newPacketCount = session.dailyPackets + completedPackets;
          
          const player = await databaseService.getPlayer(userId);
          if (player) {
            let totalCoin = 0;
            for (let i = 1; i <= completedPackets; i++) {
              totalCoin += this.calculateCoinReward(session.dailyPackets + i);
            }
            
            player.balance += totalCoin;
            player.voicePackets = (player.voicePackets || 0) + completedPackets;
            await databaseService.updatePlayer(player);

            // Memory'yi güncelle
            session.lastPacketTime = now;
            session.dailyPackets = newPacketCount;
            this.activeSessions.set(userId, session);
            
            // Firebase'e kaydet
            await updateDoc(doc(db, 'voiceCoinSessions', userId), {
              lastPacketTime: now,
              dailyPackets: newPacketCount,
            });

            Logger.success('Voice coin paketleri verildi', { 
              userId, 
              packets: completedPackets,
              totalCoin,
              totalPackets: newPacketCount,
              newBalance: player.balance
            });
          }
        }
      }
    } catch (error) {
      Logger.error('checkSessions error', error);
    }
  }

  async resetDailyCoins() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Memory'deki sessionları sıfırla
      for (const [userId, session] of this.activeSessions.entries()) {
        session.dailyPackets = 0;
        session.lastResetDate = today;
        
        this.activeSessions.set(userId, session);
        
        await updateDoc(doc(db, 'voiceCoinSessions', userId), {
          dailyPackets: 0,
          lastResetDate: today,
        });
      }
      
      Logger.success('Voice günlük coin paketleri sıfırlandı');
    } catch (error) {
      Logger.error('resetDailyCoins error', error);
    }
  }
}

export const voiceCoinService = new VoiceCoinService();
