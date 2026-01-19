"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const factionService_1 = require("../services/factionService");
const faction_1 = require("../types/faction");
// Store items
const STORE_ITEMS = {
    [faction_1.FactionType.DEMACIA]: [
        { id: 'demacia_badge', name: '⚔️ Demacia Badge', fpCost: 100, description: 'Özel Demacia rozeti' },
        { id: 'demacia_title', name: '👑 Demacia Title', fpCost: 200, description: 'İsminizin yanında "Demacian" yazısı' },
    ],
    [faction_1.FactionType.BILGEWATER]: [
        { id: 'bilgewater_badge', name: '🏴☠️ Bilgewater Badge', fpCost: 100, description: 'Özel Bilgewater rozeti' },
        { id: 'bilgewater_title', name: '☠️ Bilgewater Title', fpCost: 200, description: 'İsminizin yanında "Pirate" yazısı' },
    ],
};
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('faction_store')
        .setDescription('Faction mağazası - FP ile item satın al'),
    async execute(interaction) {
        const userFaction = await factionService_1.factionService.getUserFaction(interaction.user.id);
        if (!userFaction) {
            return interaction.reply({
                content: '❌ Bir faction\'a üye değilsiniz! `/faction join` kullanın.',
                ephemeral: true
            });
        }
        const items = STORE_ITEMS[userFaction.factionType];
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xf39c12)
            .setTitle(`🏪 ${userFaction.factionType.toUpperCase()} Store`)
            .setDescription(`Mevcut FP: **${userFaction.factionPoints}** 💎`)
            .setFooter({ text: 'Item satın almak için aşağıdan seçin' })
            .setTimestamp();
        let itemsList = '';
        items.forEach((item, index) => {
            itemsList += `**${index + 1}. ${item.name}**\n`;
            itemsList += `├ Fiyat: ${item.fpCost} FP\n`;
            itemsList += `└ ${item.description}\n\n`;
        });
        embed.addFields({
            name: '📦 Ürünler',
            value: itemsList,
            inline: false
        });
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('faction_store_select')
            .setPlaceholder('Satın almak istediğiniz ürünü seçin')
            .addOptions(items.map((item, index) => ({
            label: item.name,
            description: `${item.fpCost} FP - ${item.description}`,
            value: item.id,
        })));
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
