"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('mesaj')
    .setDescription('Bot ağzından mesaj gönder')
    .addStringOption(option => option.setName('icerik')
    .setDescription('Gönderilecek mesaj')
    .setRequired(true))
    .addChannelOption(option => option.setName('kanal')
    .setDescription('Mesajın gönderileceği kanal')
    .setRequired(false))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction) {
    const targetChannel = interaction.options.getChannel('kanal') || interaction.channel;
    const content = interaction.options.getString('icerik', true);
    if (!targetChannel.isTextBased()) {
        return interaction.reply({ content: '❌ Sadece metin kanallarına mesaj gönderilebilir!', ephemeral: true });
    }
    await targetChannel.send(content);
    await interaction.reply({ content: ` Mesaj ${targetChannel} kanalına gönderildi!`, ephemeral: true });
}
