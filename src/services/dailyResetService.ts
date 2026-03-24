import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { dailyStatsService } from './dailyStatsService';
import { Logger } from '../utils/logger';

const ISTANBUL_OFFSET = 3 * 60 * 60 * 1000; // UTC+3

export class DailyResetService {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  start(): void {
    this.scheduleMidnightReset();
    Logger.success('Daily reset scheduler başlatıldı (İstanbul saati)');
  }

  private scheduleMidnightReset(): void {
    const now = Date.now();
    const istanbulNow = new Date(now + ISTANBUL_OFFSET);
    
    // Bir sonraki gece yarısını hesapla (İstanbul saati)
    const nextMidnight = new Date(istanbulNow);
    nextMidnight.setHours(24, 0, 0, 0);
    
    const msUntilMidnight = nextMidnight.getTime() - istanbulNow.getTime();
    
    Logger.info(`Günlük reset ${Math.floor(msUntilMidnight / 1000 / 60)} dakika sonra çalışacak (İstanbul 00:00)`);
    
    this.resetTimeoutId = setTimeout(async () => {
      await this.performDailyReset();
      this.scheduleMidnightReset(); // Bir sonraki gün için schedule et
    }, msUntilMidnight);
  }

  private async performDailyReset(): Promise<void> {
    try {
      Logger.info('Günlük reset başlatılıyor...');
      
      const playersSnapshot = await getDocs(collection(db, 'players'));
      let resetCount = 0;
      
      for (const playerDoc of playersSnapshot.docs) {
        await dailyStatsService.resetDailyStats(playerDoc.id);
        resetCount++;
      }
      
      Logger.success(`Günlük reset tamamlandı: ${resetCount} kullanıcı sıfırlandı`);
    } catch (error) {
      Logger.error('Günlük reset hatası:', error);
    }
  }

  stop(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
      Logger.info('Daily reset scheduler durduruldu');
    }
  }
}

export const dailyResetService = new DailyResetService();
