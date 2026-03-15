import { VoiceState } from 'discord.js';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { databaseService } from './databaseService';
import { Logger } from '../utils/logger';

interface VoiceCoinSession {
  userId: string;
  joinedAt: Date;
  lastPacketTime: Date; // Son paket kaydedilme zamanı
  dailyPackets: number; // Bugün kaç paket aldığı
  lastResetDate: string; // YYYY-MM-DD formatında
}

class VoiceCoinService {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly PACKET_DURATION = 5 * 60 * 1000; // 5 dakika

  start() {
    this.checkInterval = setInterval(() => {
      this.checkSessions();
    }, 1 * 60 * 1000); // Her 1 dakikada kontrol et (5 dakika paketleri için)
    
    Logger.info('Voice coin tracking başlatıldı (5 dakika paket sistemi)');
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
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

      const existingSession = await getDoc(doc(db, 'voiceCoinSessions', userId));
      
      if (existingSession.exists()) {
        const session = existingSession.data() as VoiceCoinSession;
        // Eğer aynı gün ise devam et, değilse sıfırla
        if (session.lastResetDate !== today) {
          await setDoc(doc(db, 'voiceCoinSessions', userId), {
            userId,
            joinedAt: now,
            lastPacketTime: now,
            dailyPackets: 0,
            lastResetDate: today,
          });
        }
      } else {
        const session: VoiceCoinSession = {
          userId,
          joinedAt: now,
          lastPacketTime: now,
          dailyPackets: 0,
          lastResetDate: today,
        };
        await setDoc(doc(db, 'voiceCoinSessions', userId), session);
      }
      
      Logger.info('Voice coin session başladı', { userId });
    } catch (error) {
      Logger.error('startSession error', error);
    }
  }

  private async endSession(userId: string) {
    try {
      await deleteDoc(doc(db, 'voiceCoinSessions', userId));
      Logger.info('Voice coin session bitti', { userId });
    } catch (error) {
      Logger.error('endSession error', error);
    }
  }

  private calculateCoinReward(packetCount: number): number {
    // 1. paket: 40 coin
    // 2. paket: 20 coin
    // 3. paket: 10 coin
    // 4. paket: 5 coin
    // 5+ paket: 1 coin
    
    if (packetCount === 1) return 40;
    if (packetCount === 2) return 20;
    if (packetCount === 3) return 10;
    if (packetCount === 4) return 5;
    return 1; // 5+ pakette hep 1 coin
  }

  private async checkSessions() {
    try {
      const snapshot = await getDocs(collection(db, 'voiceCoinSessions'));
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      for (const docSnap of snapshot.docs) {
        const session = docSnap.data() as VoiceCoinSession;
        const userId = session.userId;

        // Gün değişmişse sıfırla
        if (session.lastResetDate !== today) {
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
          // Kaç paket tamamlandığını hesapla
          const completedPackets = Math.floor(timeSinceLastPacket / this.PACKET_DURATION);
          const newPacketCount = session.dailyPackets + completedPackets;
          
          // Oyuncuya coin ver
          const player = await databaseService.getPlayer(userId);
          if (player) {
            // Her paket için coin hesapla
            let totalCoin = 0;
            for (let i = 1; i <= completedPackets; i++) {
              totalCoin += this.calculateCoinReward(session.dailyPackets + i);
            }
            
            player.balance += totalCoin;
            player.voicePackets = (player.voicePackets || 0) + completedPackets;
            await databaseService.updatePlayer(player);

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
      const snapshot = await getDocs(collection(db, 'voiceCoinSessions'));
      const today = new Date().toISOString().split('T')[0];
      
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'voiceCoinSessions', docSnap.id), {
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
