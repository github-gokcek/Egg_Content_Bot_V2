import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { LolMatch, TftMatch, Player } from '../types';
import { Logger } from '../utils/logger';

export class DatabaseService {
  // LoL Matches
  async saveLolMatch(match: LolMatch): Promise<void> {
    try {
      await setDoc(doc(db, 'lol_matches', match.id), {
        ...match,
        createdAt: match.createdAt.toISOString()
      });
      Logger.success('LoL maç Firebase\'e kaydedildi', { matchId: match.id });
    } catch (error) {
      Logger.error('LoL maç kaydedilemedi', error);
    }
  }

  async getLolMatch(id: string): Promise<LolMatch | null> {
    try {
      const docSnap = await getDoc(doc(db, 'lol_matches', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: new Date(data.createdAt)
        } as LolMatch;
      }
      return null;
    } catch (error) {
      Logger.error('LoL maç getirilemedi', error);
      return null;
    }
  }

  async updateLolMatch(match: LolMatch): Promise<void> {
    try {
      await updateDoc(doc(db, 'lol_matches', match.id), {
        ...match,
        createdAt: match.createdAt.toISOString()
      });
      Logger.success('LoL maç güncellendi', { matchId: match.id });
    } catch (error) {
      Logger.error('LoL maç güncellenemedi', error);
    }
  }

  async deleteLolMatch(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'lol_matches', id));
      Logger.success('LoL maç silindi', { matchId: id });
    } catch (error) {
      Logger.error('LoL maç silinemedi', error);
    }
  }

  // TFT Matches
  async saveTftMatch(match: TftMatch): Promise<void> {
    try {
      await setDoc(doc(db, 'tft_matches', match.id), {
        ...match,
        createdAt: match.createdAt.toISOString()
      });
      Logger.success('TFT maç Firebase\'e kaydedildi', { matchId: match.id });
    } catch (error) {
      Logger.error('TFT maç kaydedilemedi', error);
    }
  }

  async getTftMatch(id: string): Promise<TftMatch | null> {
    try {
      const docSnap = await getDoc(doc(db, 'tft_matches', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: new Date(data.createdAt)
        } as TftMatch;
      }
      return null;
    } catch (error) {
      Logger.error('TFT maç getirilemedi', error);
      return null;
    }
  }

  async updateTftMatch(match: TftMatch): Promise<void> {
    try {
      await updateDoc(doc(db, 'tft_matches', match.id), {
        ...match,
        createdAt: match.createdAt.toISOString()
      });
      Logger.success('TFT maç güncellendi', { matchId: match.id });
    } catch (error) {
      Logger.error('TFT maç güncellenemedi', error);
    }
  }

  async deleteTftMatch(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'tft_matches', id));
      Logger.success('TFT maç silindi', { matchId: id });
    } catch (error) {
      Logger.error('TFT maç silinemedi', error);
    }
  }

  // Players
  async savePlayer(player: Player): Promise<void> {
    try {
      await setDoc(doc(db, 'players', player.discordId), player);
      Logger.success('Oyuncu Firebase\'e kaydedildi', { playerId: player.discordId });
    } catch (error) {
      Logger.error('Oyuncu kaydedilemedi', error);
    }
  }

  async getPlayer(discordId: string): Promise<Player | null> {
    try {
      const docSnap = await getDoc(doc(db, 'players', discordId));
      if (docSnap.exists()) {
        const data = docSnap.data() as Player;
        // Bakiye yoksa veya NaN ise 100 olarak ayarla
        if (data.balance === undefined || data.balance === null || isNaN(data.balance)) {
          data.balance = 100;
          await this.updatePlayer(data);
          Logger.info('Oyuncu bakiyesi düzeltildi', { playerId: discordId, newBalance: 100 });
        }
        return data;
      }
      return null;
    } catch (error) {
      Logger.error('Oyuncu getirilemedi', error);
      return null;
    }
  }

  async updatePlayer(player: Player): Promise<void> {
    try {
      await updateDoc(doc(db, 'players', player.discordId), player);
      Logger.success('Oyuncu güncellendi', { playerId: player.discordId });
    } catch (error) {
      Logger.error('Oyuncu güncellenemedi', error);
    }
  }

  // Config
  async saveConfig(guildId: string, config: any): Promise<void> {
    try {
      await setDoc(doc(db, 'guild_configs', guildId), config);
      Logger.success('Sunucu ayarları kaydedildi', { guildId });
    } catch (error) {
      Logger.error('Sunucu ayarları kaydedilemedi', error);
    }
  }

  async getConfig(guildId: string): Promise<any | null> {
    try {
      const docSnap = await getDoc(doc(db, 'guild_configs', guildId));
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      Logger.error('Sunucu ayarları getirilemedi', error);
      return null;
    }
  }
}

export const databaseService = new DatabaseService();