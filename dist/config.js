"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const discord_js_1 = require("discord.js");
exports.config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
    ],
};
