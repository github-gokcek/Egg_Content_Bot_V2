import puppeteer from 'puppeteer';
import { Logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class ScreenshotService {
  private static instance: ScreenshotService;
  private screenshotDir = path.join(__dirname, '../data/screenshots');

  private constructor() {
    // Screenshot klasörünü oluştur
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  static getInstance(): ScreenshotService {
    if (!ScreenshotService.instance) {
      ScreenshotService.instance = new ScreenshotService();
    }
    return ScreenshotService.instance;
  }

  /**
   * U.GG counter sayfasından ekran görüntüsü çek
   */
  async captureCounterPage(championId: string): Promise<string | null> {
    return this.captureUGGPage(`https://u.gg/lol/champions/${championId.toLowerCase()}/counter`, championId, 'counter', 0);
  }

  /**
   * U.GG build sayfasından ekran görüntüsü çek
   */
  async captureBuildPage(championId: string): Promise<string | null> {
    return this.captureUGGPage(`https://u.gg/lol/champions/${championId.toLowerCase()}/build`, championId, 'build', 1080);
  }

  /**
   * U.GG matchup sayfasından ekran görüntüsü çek
   */
  async captureMatchupPage(championId1: string, championId2: string): Promise<string | null> {
    const url = `https://u.gg/lol/champions/${championId1.toLowerCase()}/build?opp=${championId2.toLowerCase()}`;
    return this.captureUGGPage(url, `${championId1}_vs_${championId2}`, 'matchup', 0);
  }

  /**
   * U.GG sayfasından ekran görüntüsü çek (genel)
   */
  private async captureUGGPage(url: string, filename: string, type: string, scrollAmount: number = 0): Promise<string | null> {
    let browser;
    try {
      const screenshotPath = path.join(this.screenshotDir, `${filename}_${type}.png`);

      Logger.info(`[Screenshot] ${url} sayfası açılıyor...`);

      browser = await puppeteer.launch({
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
      } catch (e) {
        // Cookie banner yoksa devam et
      }

      // Sayfanın yüklenmesini bekle
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Eğer scroll gerekiyorsa (build sayfası için)
      if (scrollAmount > 0) {
        await page.evaluate((scroll) => {
          window.scrollBy(0, scroll);
        }, scrollAmount);
        
        // Scroll sonrası bekle
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Counter/Matchup tablosunun yüklenmesini bekle
      try {
        await page.waitForSelector('.counter-list, .counters-table, .matchup-table, [class*="counter"], [class*="matchup"], main', { timeout: 15000 });
      } catch (e) {
        Logger.warn('[Screenshot] Selector bulunamadı, tüm sayfa screenshot alınacak');
      }

      // Biraz bekle (animasyonlar ve lazy loading için)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Sadece ilgili bölümün ekran görüntüsünü al
      const element = await page.$('.counter-list, .counters-table, .matchup-table, main');
      
      if (element) {
        await element.screenshot({ path: screenshotPath });
      } else {
        // Element bulunamazsa tüm sayfanın ekran görüntüsünü al
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }

      Logger.success(`[Screenshot] Ekran görüntüsü kaydedildi: ${screenshotPath}`);
      
      await browser.close();
      return screenshotPath;

    } catch (error) {
      Logger.error('[Screenshot] Ekran görüntüsü alınamadı:', error);
      if (browser) await browser.close();
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
          Logger.info(`[Screenshot] Eski dosya silindi: ${file}`);
        }
      }
    } catch (error) {
      Logger.error('[Screenshot] Temizleme hatası:', error);
    }
  }
}

export const screenshotService = ScreenshotService.getInstance();
