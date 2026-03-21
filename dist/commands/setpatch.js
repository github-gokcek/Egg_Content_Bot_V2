"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const patchNotesService_1 = require("../services/patchNotesService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('setpatch')
        .setDescription('Patch notları kanalını ayarla')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addChannelOption(option => option
        .setName('kanal')
        .setDescription('Patch notlarının paylaşılacağı kanal')
        .addChannelTypes(discord_js_1.ChannelType.GuildText)
        .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('kanal', true);
        if (channel.type !== discord_js_1.ChannelType.GuildText) {
            return interaction.reply({ content: '❌ Lütfen bir metin kanalı seçin!', ephemeral: true });
        }
        await patchNotesService_1.patchNotesService.setPatchChannel(interaction.guildId, channel.id);
        await interaction.reply({
            content: `✅ Patch notları kanalı ${channel} olarak ayarlandı!\n\n` +
                `🔔 Yeni LoL ve TFT patch notları otomatik olarak bu kanalda paylaşılacak.\n` +
                `📋 LoL patch'leri için @LoL rolü etiketlenecek.\n` +
                `📋 TFT patch'leri için @TFT rolü etiketlenecek.`,
            ephemeral: true
        });
    },
};
