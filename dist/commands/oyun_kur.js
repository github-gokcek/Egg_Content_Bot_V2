"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const componentBuilder_1 = require("../utils/componentBuilder");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('oyun_kur')
        .setDescription('Yeni bir oyun oluştur'),
    async execute(interaction) {
        const selectMenu = componentBuilder_1.ComponentBuilder.createGameModeSelect();
        await interaction.reply({
            content: '🎮 **Oyun modu seçin:**',
            components: [selectMenu],
            ephemeral: true
        });
    },
};
