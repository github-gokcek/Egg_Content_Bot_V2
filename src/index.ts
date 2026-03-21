import { Client, Collection, Partials } from 'discord.js';
import { config } from './config';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { Logger } from './utils/logger';
import { voiceActivityService } from './services/voiceActivityService';
import { voiceCoinService } from './services/voiceCoinService';
import { patchNotesService } from './services/patchNotesService';
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
  const command = require(join(commandsPath, file));
  (client as any).commands.set(command.data.name, command);
  Logger.info(`Komut yüklendi: ${command.data.name}`);
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

// Start patch notes checking when bot is ready
client.once('ready', (client) => {
  patchNotesService.startChecking(client);
  
  // Hatırlatıcı kontrolü (her dakika)
  setInterval(async () => {
    await checkReminders(client);
  }, 60 * 1000);
  
  // Reklam mesajı (dinamik aralık)
  const startAdScheduler = async () => {
    const timerMinutes = await getAdTimer();
    setInterval(async () => {
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
  
  startAdScheduler();
  
  // Günlük reset (her gece 00:00)
  const scheduleDailyReset = () => {
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Yarın
      0, 0, 0 // 00:00:00
    );
    const msToMidnight = night.getTime() - now.getTime();
    
    setTimeout(async () => {
      Logger.info('Günlük reset başlatılıyor...');
      await voiceActivityService.resetDailyVoice();
      Logger.success('Günlük reset tamamlandı');
      
      // Bir sonraki gün için schedule et
      scheduleDailyReset();
    }, msToMidnight);
    
    Logger.info(`Günlük reset ${Math.floor(msToMidnight / 1000 / 60)} dakika sonra çalışacak`);
  };
  
  scheduleDailyReset();
  
  Logger.info('Hatırlatıcı sistemi başlatıldı');
});

client.login(config.token);
