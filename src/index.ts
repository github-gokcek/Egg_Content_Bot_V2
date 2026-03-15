import { Client, Collection, Partials } from 'discord.js';
import { config } from './config';
import { readdirSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { Logger } from './utils/logger';
import { voiceActivityService } from './services/voiceActivityService';
import { patchNotesService } from './services/patchNotesService';
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

// Start patch notes checking when bot is ready
client.once('ready', (client) => {
  patchNotesService.startChecking(client);
  
  // Hatırlatıcı kontrolü (her dakika)
  setInterval(async () => {
    await checkReminders(client);
  }, 60 * 1000);
  
  Logger.info('Hatırlatıcı sistemi başlatıldı');
});

client.login(config.token);
