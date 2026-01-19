"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const fs_1 = require("fs");
const path_1 = require("path");
require("dotenv/config");
const logger_1 = require("./utils/logger");
const voiceActivityService_1 = require("./services/voiceActivityService");
const client = new discord_js_1.Client({ intents: config_1.config.intents });
// Commands collection
client.commands = new discord_js_1.Collection();
// Load commands
const commandsPath = (0, path_1.join)(__dirname, 'commands');
const commandFiles = (0, fs_1.readdirSync)(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
for (const file of commandFiles) {
    const command = require((0, path_1.join)(commandsPath, file));
    client.commands.set(command.data.name, command);
    logger_1.Logger.info(`Komut yüklendi: ${command.data.name}`);
}
// Load events
const eventsPath = (0, path_1.join)(__dirname, 'events');
const eventFiles = (0, fs_1.readdirSync)(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
for (const file of eventFiles) {
    const event = require((0, path_1.join)(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    logger_1.Logger.info(`Event yüklendi: ${event.name}`);
}
// Start voice activity tracking
voiceActivityService_1.voiceActivityService.start();
client.login(config_1.config.token);
