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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenshotService = exports.ScreenshotService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ScreenshotService {
    static instance;
    screenshotDir = path.join(__dirname, '../data/screenshots');
    constructor() {
        // Screenshot klasörünü oluştur
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }
    static getInstance() {
        if (!ScreenshotService.instance) {
            ScreenshotService.instance = new ScreenshotService();
        }
        return ScreenshotService.instance;
    }
    /**
     * U.GG counter sayfasından ekran görüntüsü çek
     */
    async captureCounterPage(championId) {
        return this.captureUGGPage(`https://u.gg/lol/champions/${championId.toLowerCase()}/counter`, championId, 'counter');
    }
    /**
     * U.GG matchup sayfasından ekran görüntüsü çek
     */
    async captureMatchupPage(championId1, championId2) {
        const url = `https://u.gg/lol/champions/${championId1.toLowerCase()}/matchups/${championId2.toLowerCase()}`;
        return this.captureUGGPage(url, `${championId1}_vs_${championId2}`, 'matchup');
    }
    /**
     * U.GG sayfasından ekran görüntüsü çek (genel)
     */
    async captureUGGPage(url, filename, type) {
        let browser;
        try {
            const screenshotPath = path.join(this.screenshotDir, `${filename}_${type}.png`);
            logger_1.Logger.info(`[Screenshot] ${url} sayfası açılıyor...`);
            browser = await puppeteer_1.default.launch({
                headless: true,
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            // User agent ayarla
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            // Sayfayı yükle (timeout artırıldı)
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            // Cookie banner'ı kapat (varsa)
            try {
                await page.click('button[aria-label="Close"]', { timeout: 3000 });
            }
            catch (e) {
                // Cookie banner yoksa devam et
            }
            // Sayfanın yüklenmesini bekle
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Counter/Matchup tablosunun yüklenmesini bekle
            try {
                await page.waitForSelector('.counter-list, .counters-table, .matchup-table, [class*="counter"], [class*="matchup"], main', { timeout: 15000 });
            }
            catch (e) {
                logger_1.Logger.warn('[Screenshot] Selector bulunamadı, tüm sayfa screenshot alınacak');
            }
            // Biraz bekle (animasyonlar ve lazy loading için)
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Sadece ilgili bölümün ekran görüntüsünü al
            const element = await page.$('.counter-list, .counters-table, .matchup-table, main');
            if (element) {
                await element.screenshot({ path: screenshotPath });
            }
            else {
                // Element bulunamazsa tüm sayfanın ekran görüntüsünü al
                await page.screenshot({ path: screenshotPath, fullPage: false });
            }
            logger_1.Logger.success(`[Screenshot] Ekran görüntüsü kaydedildi: ${screenshotPath}`);
            await browser.close();
            return screenshotPath;
        }
        catch (error) {
            logger_1.Logger.error('[Screenshot] Ekran görüntüsü alınamadı:', error);
            if (browser)
                await browser.close();
            return null;
        }
    }
    /**
     * Eski screenshot'ları temizle (7 günden eski)
     */
    cleanOldScreenshots() {
        try {
            const files = fs.readdirSync(this.screenshotDir);
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 gün
            for (const file of files) {
                const filePath = path.join(this.screenshotDir, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                    logger_1.Logger.info(`[Screenshot] Eski dosya silindi: ${file}`);
                }
            }
        }
        catch (error) {
            logger_1.Logger.error('[Screenshot] Temizleme hatası:', error);
        }
    }
}
exports.ScreenshotService = ScreenshotService;
exports.screenshotService = ScreenshotService.getInstance();
