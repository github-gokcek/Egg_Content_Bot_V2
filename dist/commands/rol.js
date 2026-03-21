"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const roleService_1 = require("../services/roleService");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('rol')
        .setDescription('Rol seçim menüsü')
        .addSubcommand(sub => sub.setName('ver')
        .setDescription('Rol seçim mesajını gönder')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'ver') {
            if (!interaction.memberPermissions?.has('Administrator')) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yönetici olmalısınız!', ephemeral: true });
            }
            if (!interaction.guildId || !interaction.guild) {
                return interaction.reply({ content: '❌ Bu komut sadece sunucularda kullanılabilir!', ephemeral: true });
            }
            try {
                const roles = await roleService_1.roleService.getRoles(interaction.guildId);
                if (roles.length === 0) {
                    return interaction.reply({
                        content: '❌ Henüz rol eklenmemiş! `/adminrol rol ekle` komutu ile rol ekleyin.',
                        ephemeral: true
                    });
                }
                const buttons = [];
                const roleNames = [];
                for (const roleId of roles) {
                    const role = await interaction.guild.roles.fetch(roleId);
                    if (role) {
                        roleNames.push(role.name);
                        buttons.push(new discord_js_1.ButtonBuilder()
                            .setCustomId(`role_${roleId}`)
                            .setLabel(role.name)
                            .setStyle(discord_js_1.ButtonStyle.Primary));
                    }
                }
                if (buttons.length === 0) {
                    return interaction.reply({
                        content: '❌ Eklenmiş roller bulunamadı veya silinmiş!',
                        ephemeral: true
                    });
                }
                const rows = [];
                for (let i = 0; i < buttons.length; i += 5) {
                    const row = new discord_js_1.ActionRowBuilder()
                        .addComponents(buttons.slice(i, i + 5));
                    rows.push(row);
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('🎮 Rol Seçimi')
                    .setDescription('Merhaba! Oyunlar hakkında bilgi almak için rolünüzü (perminizi) buradan alabilirsiniz.\n\nAşağıdaki butonlara tıklayarak istediğiniz rolleri alabilir veya çıkarabilirsiniz.')
                    .addFields({
                    name: '📋 Mevcut Roller',
                    value: roleNames.map(name => `• ${name}`).join('\n')
                })
                    .setFooter({ text: 'Bir role tekrar tıklarsanız rol çıkarılır.' })
                    .setTimestamp();
                const message = await interaction.channel?.send({
                    embeds: [embed],
                    components: rows
                });
                if (message) {
                    await roleService_1.roleService.saveMessage(interaction.guildId, message.id, message.channelId);
                }
                await interaction.reply({ content: '✅ Rol seçim mesajı gönderildi!', ephemeral: true });
                logger_1.Logger.success('Rol seçim mesajı gönderildi', { guildId: interaction.guildId });
            }
            catch (error) {
                logger_1.Logger.error('Rol mesajı gönderilemedi', error);
                await interaction.reply({ content: '❌ Rol mesajı gönderilirken hata oluştu!', ephemeral: true });
            }
        }
    },
};
