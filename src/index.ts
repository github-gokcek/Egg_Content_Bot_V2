import { Client, Collection } from 'discord.js';
import { config } from './config';
import { readdirSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { Logger } from './utils/logger';

const client = new Client({ intents: config.intents });

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

client.login(config.token);
