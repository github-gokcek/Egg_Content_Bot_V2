import { Client, Collection, Partials } from 'discord.js';
import { config } from './config';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { Logger } from './utils/logger';
import { voiceActivityService } from './services/voiceActivityService';
import { voiceCoinService } from './services/voiceCoinService';
import { patchNotesService } from './services/patchNotesService';
import { dailyResetService } from './services/dailyResetService';
import { getAdChannel, getAdTimer } from './services/botSettings';
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import path from 'path';
const { checkReminders } = require('./commands/hatirlat');

const client = new Client({ 
  intents: config.intents,
  partials: [
    Partials.Message, // Eski mesajlar için
    Partials.Channel, // Kanal bilgisi için
    Partials.Reaction, // Reaction bilgisi için
  ]
});

// Commands collection
(client as any).commands = new Collection();

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
  try {
    const command = require(join(commandsPath, file));
    if (!command || !command.data || !command.data.name) {
      Logger.warn(`Komut atlandı (geçersiz format): ${file}`);
      continue;
    }
    (client as any).commands.set(command.data.name, command);
    Logger.info(`Komut yüklendi: ${command.data.name}`);
  } catch (error) {
    Logger.error(`Komut yüklenemedi: ${file}`, error);
  }
}

// Load events
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of eventFiles) {
  const event = require(join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  Logger.info(`Event yüklendi: ${event.name}`);
}

// Start voice activity tracking
voiceActivityService.start();

// Start voice coin tracking
voiceCoinService.start();

// Start daily reset scheduler (Istanbul timezone)
dailyResetService.start();

// Start patch notes checking when bot is ready
client.once('ready', (client) => {
  patchNotesService.startChecking(client);
  
  // Hatırlatıcı kontrolü (her dakika)
  setInterval(async () => {
    await checkReminders(client);
  }, 60 * 1000);
  
  // Reklam mesajı (dinamik aralık)
  let adIntervalId: NodeJS.Timeout | null = null;
  
  const startAdScheduler = async () => {
    // Eski interval varsa temizle
    if (adIntervalId) {
      clearInterval(adIntervalId);
    }
    
    const timerMinutes = await getAdTimer();
    
    adIntervalId = setInterval(async () => {
      const adChannelId = await getAdChannel();
      if (adChannelId) {
        try {
          const channel = await client.channels.fetch(adChannelId);
          if (channel && channel.isTextBased()) {
            const imagePath = path.join(process.cwd(), 'assetler', 'Ninja.png');
            
            if (!existsSync(imagePath)) {
              Logger.error('Reklam görseli bulunamadı: assetler/Ninja.png');
              return;
            }
            
            const attachment = new AttachmentBuilder(imagePath);
            
            const embed = new EmbedBuilder()
              .setColor(0x9b59b6)
              .setTitle('🎮 Botun Tüm Özelliklerini Keşfet!')
              .setDescription(
                '**Casino sistemini** denediniz mi? 🎰\n' +
                '**RPG maceralarına** katıldınız mı? ⚔️\n' +
                '**Günlük görevlerinizi** tamamladınız mı? 📋\n\n' +
                '**Komutları keşfet:** `/yardim`'
              )
              .setImage('attachment://Ninja.png')
              .setTimestamp();
            
            await channel.send({ embeds: [embed], files: [attachment] });
            Logger.info('Reklam mesajı gönderildi');
          }
        } catch (error) {
          Logger.error('Reklam mesajı gönderilemedi:', error);
        }
      }
    }, timerMinutes * 60 * 1000);
    
    Logger.info(`Reklam sistemi ${timerMinutes} dakika aralıkla başlatıldı`);
  };
  
  // İlk başlatma
  startAdScheduler();
  
  // Timer değiştiğinde interval'i yeniden başlat (her 5 dakikada kontrol et)
  setInterval(async () => {
    const currentTimer = await getAdTimer();
    // Eğer timer değiştiyse yeniden başlat
    startAdScheduler();
  }, 5 * 60 * 1000); // 5 dakikada bir kontrol
  
  Logger.info('Hatırlatıcı sistemi başlatıldı');
});

client.login(config.token);
