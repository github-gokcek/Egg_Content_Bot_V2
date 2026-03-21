import axios from 'axios';
import { Logger } from '../utils/logger';
import { championBuilds, championCounterData } from '../data/championMetaData';

const DDRAGON_VERSION = '14.24.1'; // Latest patch
const DDRAGON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`;
const CDRAGON_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';

interface ChampionData {
  id: string;
  key: string;
  name: string;
}

interface BuildData {
  items: number[];
  runes: {
    primaryStyle: number;
    subStyle: number;
    perks: number[];
  };
  summonerSpells: number[];
  skillOrder: string[];
}

interface MatchupData {
  championId: number;
  winRate: number;
  games: number;
}

export class ChampionDataService {
  private championCache: Map<string, ChampionData> = new Map();
  private championIdMap: Map<number, string> = new Map();

  async loadChampions() {
    if (this.championCache.size > 0) return;

    try {
      const response = await axios.get(`${DDRAGON_BASE}/data/tr_TR/champion.json`);
      const champions = response.data.data;

      for (const [key, champion] of Object.entries(champions)) {
        const champ = champion as any;
        this.championCache.set(champ.name.toLowerCase(), {
          id: champ.id,
          key: champ.key,
          name: champ.name
        });
        this.championIdMap.set(parseInt(champ.key), champ.name);
      }

      Logger.success(`${this.championCache.size} şampiyon yüklendi`);
    } catch (error) {
      Logger.error('Şampiyon verisi yüklenemedi:', error);
      throw new Error('Şampiyon verisi yüklenemedi!');
    }
  }

  findChampion(name: string): ChampionData | null {
    const normalized = name.toLowerCase().trim();
    
    // Exact match
    if (this.championCache.has(normalized)) {
      return this.championCache.get(normalized)!;
    }

    // Partial match
    for (const [key, champion] of this.championCache.entries()) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return champion;
      }
    }

    return null;
  }

  getChampionById(id: number): string | null {
    return this.championIdMap.get(id) || null;
  }

  async getBuild(championName: string, role: string = 'jungle'): Promise<any> {
    const champion = this.findChampion(championName);
    if (!champion) {
      throw new Error(`Şampiyon bulunamadı: ${championName}`);
    }

    try {
      // U.GG'nin overview API'sini kullan (build verileri burada)
      const patch = '14_24';
      const queueType = 'ranked_solo_5x5';
      const tier = 'platinum_plus';

      const url = `https://stats2.u.gg/lol/1.5/overview/${patch}/${queueType}/${champion.key}/${tier}.json`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://u.gg/',
          'Origin': 'https://u.gg'
        },
        timeout: 10000
      });

      // Response format: [[role_data], ...]
      // role_data: [role_id, stats, matchups, builds, runes, summoner_spells, skill_order, ...]
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        Logger.warn(`U.GG API'den build verisi alınamadı, fallback kullanılıyor: ${champion.id}`);
        return this.getFallbackBuild(champion.id);
      }

      // İlk rol verisini al (genellikle en popüler rol)
      const roleData = response.data[0];
      
      if (!roleData || roleData.length < 5) {
        return this.getFallbackBuild(champion.id);
      }

      const stats = roleData[1] || [];
      const builds = roleData[3] || [];
      const runes = roleData[4] || [];

      // Stats: [matches, wins, win_rate, pick_rate, ban_rate, ...]
      const winRate = stats[2] ? (stats[2] * 100).toFixed(1) : 'N/A';
      const pickRate = stats[3] ? (stats[3] * 100).toFixed(1) : 'N/A';
      const matches = stats[0] || 0;

      // Builds: [[item_ids], [item_ids], ...]
      let itemBuild = [];
      if (builds.length > 0 && Array.isArray(builds[0])) {
        itemBuild = builds[0].slice(0, 6); // İlk 6 item
      }

      // Runes: [[primary_tree, keystone, ...], ...]
      let primaryRune = null;
      if (runes.length > 0 && Array.isArray(runes[0]) && runes[0].length > 1) {
        primaryRune = runes[0][1]; // Keystone rune
      }

      return {
        champion: champion,
        stats: {
          winRate: winRate,
          pickRate: pickRate,
          matches: matches
        },
        items: itemBuild,
        rune: primaryRune,
        source: 'U.GG API'
      };

    } catch (error: any) {
      Logger.error('Build verisi alınamadı:', error.response?.status || error.message);
      return this.getFallbackBuild(champion.id);
    }
  }

  async getCounters(championName: string): Promise<any[]> {
    const champion = this.findChampion(championName);
    if (!champion) {
      throw new Error(`Şampiyon bulunamadı: ${championName}`);
    }

    // Statik counter verilerini kullan
    Logger.info(`[COUNTER] Şampiyon: ${champion.name} - Statik veri kullanılıyor`);
    return this.getStaticCounters(champion.id);
  }

  async getMatchup(champion1Name: string, champion2Name: string): Promise<any> {
    const champ1 = this.findChampion(champion1Name);
    const champ2 = this.findChampion(champion2Name);

    if (!champ1) throw new Error(`Şampiyon bulunamadı: ${champion1Name}`);
    if (!champ2) throw new Error(`Şampiyon bulunamadı: ${champion2Name}`);

    Logger.info(`[MATCHUP] ${champ1.name} vs ${champ2.name} - Statik veri kullanılıyor`);

    // Champ1'in counterlarında champ2'yi ara
    const counters = this.getStaticCounters(champ1.id);
    const matchup = counters.find(c => c.name.toLowerCase() === champ2.name.toLowerCase());

    let winRate = 0.50;
    let games = 1000;

    if (matchup) {
      winRate = matchup.winRate;
      games = matchup.games;
    }

    // Analiz oluştur
    let analysis = '';
    
    if (winRate > 0.53) {
      analysis = `${champ1.name} bu matchup'ta güçlü avantaja sahip. Erken oyunu iyi oynayarak avantajı büyütebilir.`;
    } else if (winRate > 0.51) {
      analysis = `${champ1.name} hafif avantajlı. Doğru oynanırsa kazanma şansı yüksek.`;
    } else if (winRate > 0.49) {
      analysis = 'Dengeli bir matchup. Her iki taraf da kazanabilir, skill önemli.';
    } else if (winRate > 0.47) {
      analysis = `${champ2.name} hafif avantajlı. ${champ1.name} dikkatli oynamalı.`;
      } else {
      analysis = `${champ2.name} bu matchup'ta güçlü avantaja sahip. ${champ1.name} savunmacı oynamalı.`;
    }

    return {
      champion1: champ1.name,
      champion2: champ2.name,
      winRate: winRate,
      games: games,
      analysis: analysis
    };
  }

  // Item ve rune isimlerini al
  getItemName(itemId: number): string {
    const items: { [key: number]: string } = {
      3074: 'Ravenous Hydra',
      3153: 'Blade of the Ruined King',
      6333: 'Death\'s Dance',
      3071: 'Black Cleaver',
      3053: 'Sterak\'s Gage',
      3143: 'Randuin\'s Omen',
      3065: 'Spirit Visage',
      3748: 'Titanic Hydra',
      6630: 'Goredrinker',
      6631: 'Stridebreaker',
      6632: 'Divine Sunderer',
      6653: 'Liandry\'s Anguish',
      6655: 'Luden\'s Companion',
      6656: 'Everfrost',
      3020: 'Sorcerer\'s Shoes',
      3047: 'Plated Steelcaps',
      3111: 'Mercury\'s Treads',
      3006: 'Berserker\'s Greaves',
      3158: 'Ionian Boots of Lucidity'
    };
    return items[itemId] || `Item ${itemId}`;
  }

  getRuneName(runeId: number): string {
    const runes: { [key: number]: string } = {
      8005: 'Press the Attack',
      8008: 'Lethal Tempo',
      8021: 'Fleet Footwork',
      8010: 'Conqueror',
      8112: 'Electrocute',
      8124: 'Predator',
      8128: 'Dark Harvest',
      9923: 'Hail of Blades',
      8214: 'Summon Aery',
      8229: 'Arcane Comet',
      8230: 'Phase Rush',
      8437: 'Grasp of the Undying',
      8439: 'Aftershock',
      8465: 'Guardian',
      8351: 'Glacial Augment',
      8360: 'Unsealed Spellbook',
      8369: 'First Strike'
    };
    return runes[runeId] || `Rune ${runeId}`;
  }

  private getFallbackBuild(championId: string): any {
    const buildData = this.getRecommendedBuild(championId);
    const runeData = this.getRecommendedRunes(championId);
    
    return {
      champion: { id: championId, name: championId },
      stats: {
        winRate: 'N/A',
        pickRate: 'N/A',
        matches: 0
      },
      items: buildData.items,
      itemNames: buildData.core,
      rune: runeData.name,
      source: 'Fallback Data'
    };
  }

  private getRecommendedBuild(championId: string): any {
    return championBuilds[championId] || { items: [6630, 3047, 3071, 6333, 3053, 3065], core: ['Mythic Item', 'Boots', 'Legendary Items'], rune: 'Conqueror' };
  }

  private getRecommendedRunes(championId: string): any {
    const build = championBuilds[championId];
    if (build && build.rune) {
      return { primary: 8010, secondary: 8000, name: build.rune };
    }
    return { primary: 8010, secondary: 8000, name: 'Conqueror' };
  }

  private getStaticCounters(championId: string): any[] {
    // championCounterData'dan al
    if (championCounterData[championId]) {
      return championCounterData[championId];
    }
    
    // Fallback: Genel counter tipleri
    return [
      { name: 'Tank Şampiyonlar', winRate: 0.52, games: 3000 },
      { name: 'CC Ağır Şampiyonlar', winRate: 0.51, games: 2800 },
      { name: 'Poke Şampiyonları', winRate: 0.51, games: 2600 },
      { name: 'Mobility Şampiyonları', winRate: 0.50, games: 2400 },
      { name: 'Sustain Şampiyonları', winRate: 0.50, games: 2200 }
    ];
  }
}

export const championDataService = new ChampionDataService();
