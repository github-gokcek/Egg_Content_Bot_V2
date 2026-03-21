"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchNotesService = exports.PatchNotesService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const logger_1 = require("../utils/logger");
class PatchNotesService {
    static instance;
    checkInterval = null;
    constructor() { }
    static getInstance() {
        if (!PatchNotesService.instance) {
            PatchNotesService.instance = new PatchNotesService();
        }
        return PatchNotesService.instance;
    }
    async setPatchChannel(guildId, channelId) {
        const config = { guildId, channelId };
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'patch_configs', guildId), config, { merge: true });
        logger_1.Logger.success('Patch kanalı ayarlandı', { guildId, channelId });
    }
    async getPatchConfig(guildId) {
        const docRef = (0, firestore_1.doc)(firebase_1.db, 'patch_configs', guildId);
        const docSnap = await (0, firestore_1.getDoc)(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    }
    async updateLastPatch(guildId, game, patchId) {
        const field = game === 'lol' ? 'lastLolPatch' : 'lastTftPatch';
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'patch_configs', guildId), { [field]: patchId });
    }
    async fetchLatestPatch(game) {
        try {
            const url = game === 'lol'
                ? 'https://www.leagueoflegends.com/tr-tr/news/tags/patch-notes/'
                : 'https://teamfighttactics.leagueoflegends.com/tr-tr/news/';
            const response = await fetch(url);
            const html = await response.text();
            // Tüm game-updates linklerini bul
            const hrefMatches = html.matchAll(/href="([^"]*\/game-updates\/[^"]+)"/gi);
            const uniqueUrls = new Set();
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
            logger_1.Logger.info(`${game.toUpperCase()} için ${uniqueUrls.size} article bulundu`);
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
                    // Resim bul - önce büyük resimleri ara, sonra og:image
                    let image;
                    // 1. Yöntem: Article body içindeki büyük resimleri bul
                    const imgMatches = articleHtml.matchAll(/<img[^>]+src="(https:\/\/[^"]+)"[^>]*>/gi);
                    for (const match of imgMatches) {
                        const imgUrl = match[1];
                        // Büyük resim boyutlarını içeren URL'leri tercih et
                        if (imgUrl.includes('1920') || imgUrl.includes('1280') || imgUrl.includes('banner')) {
                            image = imgUrl;
                            break;
                        }
                    }
                    // 2. Yöntem: og:image
                    if (!image) {
                        const ogImageMatch = articleHtml.match(/<meta property="og:image" content="([^"]+)"/);
                        image = ogImageMatch ? ogImageMatch[1] : undefined;
                    }
                    // 3. Yöntem: İlk bulduğun herhangi bir büyük resim
                    if (!image) {
                        const firstImgMatch = articleHtml.match(/<img[^>]+src="(https:\/\/[^"]+\.(jpg|png|webp))"[^>]*>/i);
                        image = firstImgMatch ? firstImgMatch[1] : undefined;
                    }
                    logger_1.Logger.success(`${game.toUpperCase()} patch bulundu: ${title}`);
                    return {
                        title,
                        link: articleUrl,
                        pubDate: new Date().toISOString(),
                        image
                    };
                }
                catch (err) {
                    continue;
                }
            }
            logger_1.Logger.warn(`${game.toUpperCase()} için patch notu bulunamadı`);
            return null;
        }
        catch (error) {
            logger_1.Logger.error(`${game.toUpperCase()} patch fetch hatası`, error);
            return null;
        }
    }
    startChecking(client) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        // Her 10 dakikada bir kontrol et
        this.checkInterval = setInterval(async () => {
            await this.checkAllGuilds(client);
        }, 10 * 60 * 1000); // 10 dakika
        // İlk kontrolü hemen yap
        this.checkAllGuilds(client);
        logger_1.Logger.success('Patch kontrol sistemi başlatıldı (10 dakikada bir)');
    }
    async checkAllGuilds(client) {
        try {
            const guilds = client.guilds.cache;
            for (const [guildId, guild] of guilds) {
                const config = await this.getPatchConfig(guildId);
                if (!config || !config.channelId)
                    continue;
                const channel = await guild.channels.fetch(config.channelId).catch(() => null);
                if (!channel || !channel.isTextBased())
                    continue;
                // LoL patch kontrol
                const lolPatch = await this.fetchLatestPatch('lol');
                if (lolPatch && lolPatch.title !== config.lastLolPatch) {
                    const lolRole = guild.roles.cache.find((r) => r.name.toLowerCase() === 'lol');
                    const mention = lolRole ? `<@&${lolRole.id}>` : '@LoL';
                    const { EmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
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
                    logger_1.Logger.success('LoL patch paylaşıldı', { guildId, patch: lolPatch.title });
                }
                // TFT patch kontrol
                const tftPatch = await this.fetchLatestPatch('tft');
                if (tftPatch && tftPatch.title !== config.lastTftPatch) {
                    const tftRole = guild.roles.cache.find((r) => r.name.toLowerCase() === 'tft');
                    const mention = tftRole ? `<@&${tftRole.id}>` : '@TFT';
                    const { EmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
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
                    logger_1.Logger.success('TFT patch paylaşıldı', { guildId, patch: tftPatch.title });
                }
            }
        }
        catch (error) {
            logger_1.Logger.error('Patch kontrol hatası', error);
        }
    }
    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            logger_1.Logger.info('Patch kontrol sistemi durduruldu');
        }
    }
}
exports.PatchNotesService = PatchNotesService;
exports.patchNotesService = PatchNotesService.getInstance();
