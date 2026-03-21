"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleShop = handleShop;
exports.handleBuy = handleBuy;
exports.handleSell = handleSell;
const discord_js_1 = require("discord.js");
const rpgService_1 = require("../services/rpgService");
const items_1 = require("../data/items");
async function handleShop(interaction) {
    const shopItems = (0, items_1.getShopItems)();
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('🏪 RPG Shop')
        .setDescription('Satın almak için `/rpg buy <item_id>` kullan\nSatmak için `/rpg sell <item_id>` kullan')
        .setTimestamp();
    const weapons = shopItems.filter(i => i.type === 'weapon');
    const armor = shopItems.filter(i => i.type === 'armor');
    const accessories = shopItems.filter(i => i.type === 'accessory');
    const consumables = shopItems.filter(i => i.type === 'consumable');
    if (weapons.length > 0) {
        const weaponList = weapons.map(item => `\`${item.id}\` - **${item.name}** (Lv.${item.level}) - ${item.price} 🪙`).join('\n');
        embed.addFields({ name: '⚔️ Weapons', value: weaponList, inline: false });
    }
    if (armor.length > 0) {
        const armorList = armor.map(item => `\`${item.id}\` - **${item.name}** (Lv.${item.level}) - ${item.price} 🪙`).join('\n');
        embed.addFields({ name: '🛡️ Armor', value: armorList, inline: false });
    }
    if (accessories.length > 0) {
        const accList = accessories.map(item => `\`${item.id}\` - **${item.name}** (Lv.${item.level}) - ${item.price} 🪙`).join('\n');
        embed.addFields({ name: '💍 Accessories', value: accList, inline: false });
    }
    if (consumables.length > 0) {
        const consList = consumables.map(item => `\`${item.id}\` - **${item.name}** - ${item.price} 🪙`).join('\n');
        embed.addFields({ name: '🧪 Consumables', value: consList, inline: false });
    }
    await interaction.reply({ embeds: [embed] });
}
async function handleBuy(interaction) {
    const itemId = interaction.options.getString('item', true);
    const amount = interaction.options.getInteger('miktar') || 1;
    const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
    if (!character) {
        return interaction.reply({
            content: '❌ Önce `/rpg create` ile karakter oluşturmalısın!',
            ephemeral: true
        });
    }
    const item = (0, items_1.getItem)(itemId);
    if (!item) {
        return interaction.reply({
            content: '❌ Item bulunamadı! `/rpg shop` ile mevcut itemleri gör.',
            ephemeral: true
        });
    }
    if (item.type === 'material') {
        return interaction.reply({
            content: '❌ Materyaller satın alınamaz!',
            ephemeral: true
        });
    }
    if (character.level < item.level) {
        return interaction.reply({
            content: `❌ Bu item için Level ${item.level} gerekli! (Mevcut: ${character.level})`,
            ephemeral: true
        });
    }
    const totalPrice = item.price * amount;
    if (character.rpgCoin < totalPrice) {
        return interaction.reply({
            content: `❌ Yetersiz RPG Coin! Gerekli: ${totalPrice} 🪙 (Mevcut: ${character.rpgCoin} 🪙)`,
            ephemeral: true
        });
    }
    if (character.inventory.length >= character.maxInventorySize && !item.stackable) {
        return interaction.reply({
            content: '❌ Envanter dolu!',
            ephemeral: true
        });
    }
    character.rpgCoin -= totalPrice;
    const existingItem = character.inventory.find(i => i.itemId === itemId && !i.equipped);
    if (existingItem && item.stackable) {
        existingItem.amount += amount;
    }
    else {
        character.inventory.push({
            itemId: itemId,
            amount: amount,
            equipped: false
        });
    }
    await rpgService_1.rpgService.updateCharacter(character);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Satın Alma Başarılı!')
        .setDescription(`**${item.name}** x${amount} satın aldın!`)
        .addFields({ name: '💰 Harcanan', value: `${totalPrice} 🪙`, inline: true }, { name: '💰 Kalan', value: `${character.rpgCoin} 🪙`, inline: true })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
async function handleSell(interaction) {
    const itemId = interaction.options.getString('item', true);
    const amount = interaction.options.getInteger('miktar') || 1;
    const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
    if (!character) {
        return interaction.reply({
            content: '❌ Önce `/rpg create` ile karakter oluşturmalısın!',
            ephemeral: true
        });
    }
    const inventoryItem = character.inventory.find(i => i.itemId === itemId && !i.equipped);
    if (!inventoryItem || inventoryItem.amount < amount) {
        return interaction.reply({
            content: '❌ Envanterde yeterli miktar yok!',
            ephemeral: true
        });
    }
    const item = (0, items_1.getItem)(itemId);
    if (!item) {
        return interaction.reply({
            content: '❌ Item bulunamadı!',
            ephemeral: true
        });
    }
    const totalSellPrice = item.sellPrice * amount;
    inventoryItem.amount -= amount;
    if (inventoryItem.amount <= 0) {
        character.inventory = character.inventory.filter(i => i !== inventoryItem);
    }
    character.rpgCoin += totalSellPrice;
    await rpgService_1.rpgService.updateCharacter(character);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Satış Başarılı!')
        .setDescription(`**${item.name}** x${amount} sattın!`)
        .addFields({ name: '💰 Kazanılan', value: `${totalSellPrice} 🪙`, inline: true }, { name: '💰 Toplam', value: `${character.rpgCoin} 🪙`, inline: true })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
