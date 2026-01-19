import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Logger } from '../utils/logger';

interface Duel {
  id: string;
  challenger: string;
  challenged: string;
  amount: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  winner?: string;
  createdAt: Date;
}

export class DuelService {
  async createDuel(challenger: string, challenged: string, amount: number): Promise<Duel> {
    const duel: Duel = {
      id: Date.now().toString(),
      challenger,
      challenged,
      amount,
      status: 'pending',
      createdAt: new Date()
    };

    await setDoc(doc(db, 'duels', duel.id), duel);
    Logger.success('Düello oluşturuldu', { duelId: duel.id, challenger, challenged, amount });
    return duel;
  }

  async getDuel(id: string): Promise<Duel | null> {
    const docSnap = await getDoc(doc(db, 'duels', id));
    return docSnap.exists() ? docSnap.data() as Duel : null;
  }

  async acceptDuel(id: string): Promise<boolean> {
    const duel = await this.getDuel(id);
    if (duel && duel.status === 'pending') {
      await updateDoc(doc(db, 'duels', id), { status: 'accepted' });
      Logger.info('Düello kabul edildi', { duelId: id });
      return true;
    }
    return false;
  }

  async completeDuel(id: string, winner: string): Promise<boolean> {
    const duel = await this.getDuel(id);
    if (duel && duel.status === 'accepted') {
      await updateDoc(doc(db, 'duels', id), { status: 'completed', winner });
      Logger.success('Düello tamamlandı', { duelId: id, winner });
      return true;
    }
    return false;
  }

  async cancelDuel(id: string): Promise<boolean> {
    const duel = await this.getDuel(id);
    if (duel && duel.status === 'pending') {
      await updateDoc(doc(db, 'duels', id), { status: 'cancelled' });
      Logger.info('Düello iptal edildi', { duelId: id });
      return true;
    }
    return false;
  }

  async deleteDuel(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'duels', id));
      Logger.info('Düello silindi', { duelId: id });
      return true;
    } catch {
      return false;
    }
  }

  async getUserActiveDuels(userId: string): Promise<Duel[]> {
    const q = query(collection(db, 'duels'), where('status', 'in', ['pending', 'accepted']));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => doc.data() as Duel)
      .filter(duel => duel.challenger === userId || duel.challenged === userId);
  }
}

export const duelService = new DuelService();