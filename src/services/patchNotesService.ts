import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Logger } from '../utils/logger';

interface PatchConfig {
  guildId: string;
  channelId: string;
  lastLolPatch?: string;
  lastTftPatch?: string;
}

export class PatchNotesService {
  private static instance: PatchNotesService;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): PatchNotesService {
    if (!PatchNotesService.instance) {
      PatchNotesService.instance = new PatchNotesService();
    }
    return PatchNotesService.instance;
  }

  async setPatchChannel(guildId: string, channelId: string): Promise<void> {
    const config: PatchConfig = { guildId, channelId };
    await setDoc(doc(db, 'patch_configs', guildId), config, { merge: true });
    Logger.success('Patch kanalı ayarlandı', { guildId, channelId });
  }

  async getPatchConfig(guildId: string): Promise<PatchConfig | null> {
    const docRef = doc(db, 'patch_configs', guildId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as PatchConfig) : null;
  }

  async updateLastPatch(guildId: string, game: 'lol' | 'tft', patchId: string): Promise<void> {
    const field = game === 'lol' ? 'lastLolPatch' : 'lastTftPatch';
    await updateDoc(doc(db, 'patch_configs', guildId), { [field]: patchId });
  }

  async fetchLatestPatch(game: 'lol' | 'tft'): Promise<{ title: string; link: string; pubDate: string; image?: string } | null> {
    try {
      const url = game === 'lol'
        ? 'https://www.leagueoflegends.com/tr-tr/news/tags/patch-notes/'
        : 'https://teamfighttactics.leagueoflegends.com/tr-tr/news/';

      const response = await fetch(url);
      const html = await response.text();

      // Tüm game-updates linklerini bul
      const hrefMatches = html.matchAll(/href="([^"]*\/game-updates\/[^"]+)"/gi);
      const uniqueUrls = new Set<string>();
      
      for (const match of hrefMatches) {
        let articleUrl = match[1];
        if (!articleUrl.startsWith('http')) {
          const baseUrl = game === 'lol' 
            ? 'https://www.leagueoflegends.com'
            : 'https://teamfighttactics.leagueoflegends.com';
          articleUrl = articleUrl.startsWith('/') 
            ? `${baseUrl}${articleUrl}`
            : `${baseUrl}/${articleUrl}`;
        }
        uniqueUrls.add(articleUrl);
      }

      Logger.info(`${game.toUpperCase()} için ${uniqueUrls.size} article bulundu`);

      // Her article'i kontrol et
      for (const articleUrl of uniqueUrls) {
        try {
          // URL'de patch kelimesi var mı kontrol et
          const patchPattern = game === 'lol' 
            ? /league-of-legends-patch-\d+-\d+/i
            : /teamfight-tactics-patch-\d+-\d+/i;
          
          if (!patchPattern.test(articleUrl)) {
            continue;
          }

          // Article sayfasını çek
          const articleResponse = await fetch(articleUrl);
          const articleHtml = await articleResponse.text();

          // Başlığı al
          const titleMatch = articleHtml.match(/<title>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].replace(/\s*\|.*$/, '').trim() : 'Yeni Yama Notları';

          // "Yamada önce çıkanlar" veya "Patch Highlights" başlığından sonraki ilk resmi bul
          let image: string | undefined;
          
          // Önce "Yamada önce çıkanlar" başlığını bul
          const highlightsMatch = articleHtml.match(/yamada.*?önce.*?çıkanlar/i) || 
                                 articleHtml.match(/patch.*?highlights/i);
          
          if (highlightsMatch) {
            // Başlıktan sonraki kısmı al
            const afterHighlights = articleHtml.substring(articleHtml.indexOf(highlightsMatch[0]));
            
            // İlk büyük resmi bul (genelde 1920x1080 veya benzeri)
            const imageMatch = afterHighlights.match(/<img[^>]+src="(https:\/\/[^"]+\.(jpg|png|webp))"[^>]*>/i) ||
                              afterHighlights.match(/url\(['"]?(https:\/\/[^'"\)]+\.(jpg|png|webp))['"]?\)/i);
            
            if (imageMatch) {
              image = imageMatch[1];
            }
          }
          
          // Eğer bulunamadıysa og:image'i kullan
          if (!image) {
            const ogImageMatch = articleHtml.match(/<meta property="og:image" content="([^"]+)"/);
            image = ogImageMatch ? ogImageMatch[1] : undefined;
          }

          Logger.success(`${game.toUpperCase()} patch bulundu: ${title}`);

          return {
            title,
            link: articleUrl,
            pubDate: new Date().toISOString(),
            image
          };
        } catch (err) {
          continue;
        }
      }

      Logger.warn(`${game.toUpperCase()} için patch notu bulunamadı`);
      return null;
    } catch (error) {
      Logger.error(`${game.toUpperCase()} patch fetch hatası`, error);
      return null;
    }
  }

  startChecking(client: any): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Her 10 dakikada bir kontrol et
    this.checkInterval = setInterval(async () => {
      await this.checkAllGuilds(client);
    }, 10 * 60 * 1000); // 10 dakika

    // İlk kontrolü hemen yap
    this.checkAllGuilds(client);
    Logger.success('Patch kontrol sistemi başlatıldı (10 dakikada bir)');
  }

  private async checkAllGuilds(client: any): Promise<void> {
    try {
      const guilds = client.guilds.cache;
      
      for (const [guildId, guild] of guilds) {
        const config = await this.getPatchConfig(guildId);
        if (!config || !config.channelId) continue;

        const channel = await guild.channels.fetch(config.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) continue;

        // LoL patch kontrol
        const lolPatch = await this.fetchLatestPatch('lol');
        if (lolPatch && lolPatch.title !== config.lastLolPatch) {
          const lolRole = guild.roles.cache.find((r: any) => r.name.toLowerCase() === 'lol');
          const mention = lolRole ? `<@&${lolRole.id}>` : '@LoL';
          
          const { EmbedBuilder } = await import('discord.js');
          const embed = new EmbedBuilder()
            .setColor(0x0397AB)
            .setTitle(lolPatch.title)
            .setURL(lolPatch.link)
            .setDescription(`🔗 [Patch Notlarını Oku](${lolPatch.link})`)
            .setTimestamp();

          if (lolPatch.image) {
            embed.setImage(lolPatch.image);
          }

          await channel.send({
            content: `${mention} **Yeni League of Legends Patch Notları!**`,
            embeds: [embed]
          });

          await this.updateLastPatch(guildId, 'lol', lolPatch.title);
          Logger.success('LoL patch paylaşıldı', { guildId, patch: lolPatch.title });
        }

        // TFT patch kontrol
        const tftPatch = await this.fetchLatestPatch('tft');
        if (tftPatch && tftPatch.title !== config.lastTftPatch) {
          const tftRole = guild.roles.cache.find((r: any) => r.name.toLowerCase() === 'tft');
          const mention = tftRole ? `<@&${tftRole.id}>` : '@TFT';
          
          const { EmbedBuilder } = await import('discord.js');
          const embed = new EmbedBuilder()
            .setColor(0xE4A93C)
            .setTitle(tftPatch.title)
            .setURL(tftPatch.link)
            .setDescription(`🔗 [Patch Notlarını Oku](${tftPatch.link})`)
            .setTimestamp();

          if (tftPatch.image) {
            embed.setImage(tftPatch.image);
          }

          await channel.send({
            content: `${mention} **Yeni Teamfight Tactics Patch Notları!**`,
            embeds: [embed]
          });

          await this.updateLastPatch(guildId, 'tft', tftPatch.title);
          Logger.success('TFT patch paylaşıldı', { guildId, patch: tftPatch.title });
        }
      }
    } catch (error) {
      Logger.error('Patch kontrol hatası', error);
    }
  }

  stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      Logger.info('Patch kontrol sistemi durduruldu');
    }
  }
}

export const patchNotesService = PatchNotesService.getInstance();
