"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botun gecikmesini gösterir'),
    async execute(interaction) {
        await interaction.reply(`🏓 Pong! ${interaction.client.ws.ping}ms`);
    },
};
