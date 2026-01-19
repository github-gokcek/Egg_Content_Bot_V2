"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const configService_1 = require("../services/configService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('disable')
        .setDescription('Kanal ayarlarını devre dışı bırak')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand => subcommand
        .setName('game_channel')
        .setDescription('Oyun kanalını devre dışı bırak')
        .addStringOption(option => option.setName('oyun')
        .setDescription('Oyun türü')
        .setRequired(true)
        .addChoices({ name: 'LoL', value: 'lol' }, { name: 'TFT', value: 'tft' })))
        .addSubcommand(subcommand => subcommand
        .setName('winnerlog_channel')
        .setDescription('Sonuç kanalını devre dışı bırak')
        .addStringOption(option => option.setName('oyun')
        .setDescription('Oyun türü')
        .setRequired(true)
        .addChoices({ name: 'LoL', value: 'lol' }, { name: 'TFT', value: 'tft' }))),
    async execute(interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: '❌ Bu komut sadece sunucularda kullanılabilir!', ephemeral: true });
        }
        const subcommand = interaction.options.getSubcommand();
        const game = interaction.options.getString('oyun', true);
        if (subcommand === 'game_channel') {
            const disabled = await configService_1.configService.disableGameChannel(interaction.guildId, game);
            if (disabled) {
                await interaction.reply({
                    content: `✅ ${game.toUpperCase()} oyun kanalı devre dışı bırakıldı!`,
                    ephemeral: true
                });
            }
            else {
                await interaction.reply({
                    content: `❌ ${game.toUpperCase()} için ayarlanmış oyun kanalı bulunamadı!`,
                    ephemeral: true
                });
            }
        }
        else if (subcommand === 'winnerlog_channel') {
            const disabled = await configService_1.configService.disableWinnerLogChannel(interaction.guildId, game);
            if (disabled) {
                await interaction.reply({
                    content: `✅ ${game.toUpperCase()} sonuç kanalı devre dışı bırakıldı!`,
                    ephemeral: true
                });
            }
            else {
                await interaction.reply({
                    content: `❌ ${game.toUpperCase()} için ayarlanmış sonuç kanalı bulunamadı!`,
                    ephemeral: true
                });
            }
        }
    },
};
