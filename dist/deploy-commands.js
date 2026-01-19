"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
require("dotenv/config");
const commands = [];
const commandsPath = (0, path_1.join)(__dirname, 'commands');
const commandFiles = (0, fs_1.readdirSync)(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
for (const file of commandFiles) {
    const command = require((0, path_1.join)(commandsPath, file));
    commands.push(command.data.toJSON());
}
const rest = new discord_js_1.REST().setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        console.log(`🔄 ${commands.length} komut yükleniyor...`);
        await rest.put(discord_js_1.Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
        console.log('✅ Komutlar başarıyla yüklendi!');
    }
    catch (error) {
        console.error(error);
    }
})();
