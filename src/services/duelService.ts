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
  private duels: Map<string, Duel> = new Map();

  createDuel(challenger: string, challenged: string, amount: number): Duel {
    const duel: Duel = {
      id: Date.now().toString(),
      challenger,
      challenged,
      amount,
      status: 'pending',
      createdAt: new Date()
    };

    this.duels.set(duel.id, duel);
    Logger.success('Düello oluşturuldu', { duelId: duel.id, challenger, challenged, amount });
    return duel;
  }

  getDuel(id: string): Duel | undefined {
    return this.duels.get(id);
  }

  acceptDuel(id: string): boolean {
    const duel = this.duels.get(id);
    if (duel && duel.status === 'pending') {
      duel.status = 'accepted';
      Logger.info('Düello kabul edildi', { duelId: id });
      return true;
    }
    return false;
  }

  completeDuel(id: string, winner: string): boolean {
    const duel = this.duels.get(id);
    if (duel && duel.status === 'accepted') {
      duel.status = 'completed';
      duel.winner = winner;
      Logger.success('Düello tamamlandı', { duelId: id, winner });
      return true;
    }
    return false;
  }

  cancelDuel(id: string): boolean {
    const duel = this.duels.get(id);
    if (duel && duel.status === 'pending') {
      duel.status = 'cancelled';
      Logger.info('Düello iptal edildi', { duelId: id });
      return true;
    }
    return false;
  }

  deleteDuel(id: string): boolean {
    const deleted = this.duels.delete(id);
    if (deleted) Logger.info('Düello silindi', { duelId: id });
    return deleted;
  }

  getUserActiveDuels(userId: string): Duel[] {
    return Array.from(this.duels.values()).filter(
      duel => (duel.challenger === userId || duel.challenged === userId) && 
               (duel.status === 'pending' || duel.status === 'accepted')
    );
  }
}

export const duelService = new DuelService();