"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const inventoryService_1 = require("../services/inventoryService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('market')
        .setDescription('Market sistemi')
        .addSubcommand(sub => sub.setName('list')
        .setDescription('Market ürünlerini listele'))
        .addSubcommand(sub => sub.setName('buy')
        .setDescription('Eşya satın al')
        .addStringOption(opt => opt.setName('item').setDescription('Satın alınacak eşya').setRequired(true)
        .addChoices({ name: '👑 Custom Title - 5000 coin', value: 'custom_title' }, { name: '⬇️ Derank - 1000 coin', value: 'derank' }, { name: '🚪 Özel Oda - 5000 coin', value: 'private_room' }, { name: '🎭 Sticker Ekleme - 2000 coin', value: 'sticker_add' }, { name: '📌 Pin - 500 coin', value: 'pin' }, { name: '💬 Trashtalk - 100 coin', value: 'trashtalk' }))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'list') {
            let player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
            if (!player) {
                // Oyuncu yoksa otomatik oluştur
                player = {
                    discordId: interaction.user.id,
                    username: interaction.user.username,
                    balance: 0,
                    createdAt: new Date(),
                    stats: {
                        lol: { wins: 0, losses: 0 },
                        tft: { matches: 0, top4: 0, rankings: [], points: 0 }
                    }
                };
                await databaseService_1.databaseService.savePlayer(player);
            }
            const balance = player.balance;
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x3498db)
                .setTitle('🛒 Market - Eşya Mağazası')
                .setDescription(`💳 **Bakiyeniz:** ${player.balance} 🪙\n\n🛍️ **Mevcut Ürünler:**`)
                .addFields(inventoryService_1.MARKET_ITEMS.map(item => ({
                name: `${item.emoji} ${item.name}`,
                value: `📝 ${item.description}\n💰 **Fiyat:** ${item.price} 🪙\n📊 **Durum:** ${player.balance >= item.price ? '✅ Satın Alabilirsiniz' : '❌ Yetersiz Bakiye'}`,
                inline: true
            })))
                .setFooter({ text: '💡 Eşya satın almak için: /market buy item:[EşyaAdı]' })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'buy') {
            const itemId = interaction.options.getString('item', true);
            let player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
            if (!player) {
                // Oyuncu yoksa otomatik oluştur
                player = {
                    discordId: interaction.user.id,
                    username: interaction.user.username,
                    balance: 0,
                    createdAt: new Date(),
                    stats: {
                        lol: { wins: 0, losses: 0 },
                        tft: { matches: 0, top4: 0, rankings: [], points: 0 }
                    }
                };
                await databaseService_1.databaseService.savePlayer(player);
            }
            const item = inventoryService_1.MARKET_ITEMS.find(i => i.id === itemId);
            if (!item) {
                return interaction.reply({
                    content: '❌ Bu eşya markette satılmıyor!',
                    ephemeral: true
                });
            }
            if (player.balance < item.price) {
                return interaction.reply({
                    content: `❌ Bakiyeniz yetersiz! Gerekli: ${item.price} 🪙, Mevcut: ${player.balance} 🪙`,
                    ephemeral: true
                });
            }
            // Bakiyeyi düş ve eşyayı envantere ekle
            player.balance -= item.price;
            await databaseService_1.databaseService.updatePlayer(player);
            await inventoryService_1.inventoryService.addItem(interaction.user.id, itemId);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🎉 Satın Alma Başarılı!')
                .setDescription(`${item.emoji} **${item.name}** başarıyla satın alındı!\n\n📦 Envanterinize eklendi!`)
                .addFields({ name: '💰 Ödenen Tutar', value: `${item.price} 🪙`, inline: true }, { name: '💳 Kalan Bakiye', value: `${player.balance} 🪙`, inline: true }, { name: '📦 Aldığınız Eşya', value: `${item.emoji} ${item.name}`, inline: true })
                .setFooter({ text: 'Envanterinizi görmek için: /envanter' })
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
    },
};
