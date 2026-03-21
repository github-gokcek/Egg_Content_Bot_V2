"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const inventoryService_1 = require("../services/inventoryService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('envanter')
        .setDescription('Envanterini görüntüle')
        .addUserOption(option => option.setName('user')
        .setDescription('Envanterini görmek istediğin kullanıcı (opsiyonel)')
        .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const inventory = await inventoryService_1.inventoryService.getUserInventory(targetUser.id);
        const unusedItems = inventory.items.filter(i => !i.used);
        const usedItems = inventory.items.filter(i => i.used);
        if (inventory.items.length === 0) {
            return interaction.reply({
                content: `📦 ${targetUser.username} henüz hiç eşya satın almamış!`,
                ephemeral: true
            });
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle(`📦 ${targetUser.username} - Envanter`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        if (unusedItems.length > 0) {
            const itemCounts = new Map();
            unusedItems.forEach(item => {
                itemCounts.set(item.type, (itemCounts.get(item.type) || 0) + 1);
            });
            const itemList = Array.from(itemCounts.entries())
                .map(([type, count]) => {
                const item = unusedItems.find(i => i.type === type);
                const emoji = this.getItemEmoji(type);
                return `${emoji} **${item.name}** x${count}`;
            })
                .join('\n');
            embed.addFields({
                name: '✨ Kullanılabilir Eşyalar',
                value: itemList,
                inline: false
            });
        }
        else {
            embed.addFields({
                name: '✨ Kullanılabilir Eşyalar',
                value: 'Kullanılabilir eşya yok',
                inline: false
            });
        }
        if (usedItems.length > 0) {
            const recentUsed = usedItems
                .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
                .slice(0, 5)
                .map(item => {
                const emoji = this.getItemEmoji(item.type);
                const date = new Date(item.usedAt).toLocaleDateString('tr-TR');
                return `${emoji} ${item.name} - ${date}`;
            })
                .join('\n');
            embed.addFields({
                name: '📜 Son Kullanılan Eşyalar',
                value: recentUsed,
                inline: false
            });
        }
        embed.setFooter({
            text: `Toplam ${unusedItems.length} kullanılabilir, ${usedItems.length} kullanılmış eşya`
        });
        await interaction.reply({ embeds: [embed] });
    },
    getItemEmoji(type) {
        const emojis = {
            'custom_title': '👑',
            'derank': '⬇️',
            'uprank': '⬆️',
            'pin': '📌',
            'trashtalk': '💬'
        };
        return emojis[type] || '📦';
    }
};
