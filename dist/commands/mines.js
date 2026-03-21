"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const questService_1 = require("../services/questService");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
function generateGrid(totalMines = 5) {
    const grid = new Array(20).fill(false); // 4x5 = 20 kare
    const minePositions = new Set();
    while (minePositions.size < totalMines) {
        minePositions.add(Math.floor(Math.random() * 20));
    }
    minePositions.forEach(pos => grid[pos] = true);
    return grid;
}
function calculateMultiplier(safeRevealed, totalMines) {
    // Basit ve doğru formül
    // Teorik: multiplier = total_tiles / remaining_safe_tiles
    // %10 house edge: multiplier = theoretical * 0.90
    const totalTiles = 20; // 4x5 grid
    const totalSafeTiles = totalTiles - totalMines;
    const remainingSafeTiles = totalSafeTiles - safeRevealed;
    if (remainingSafeTiles <= 0)
        return 1.0;
    // Teorik multiplier
    const theoretical = totalTiles / remainingSafeTiles;
    // %10 house edge uygula
    const multiplier = theoretical * 0.90;
    return multiplier;
}
function createGridButtons(game, disabled = false) {
    const rows = [];
    // 4 satır x 5 sütun = 20 kare
    for (let row = 0; row < 4; row++) {
        const actionRow = new discord_js_1.ActionRowBuilder();
        for (let col = 0; col < 5; col++) {
            const index = row * 5 + col;
            let emoji = '⬜';
            let style = discord_js_1.ButtonStyle.Secondary;
            if (game.revealed[index]) {
                if (game.grid[index]) {
                    emoji = '💣';
                    style = discord_js_1.ButtonStyle.Danger;
                }
                else {
                    emoji = '💎';
                    style = discord_js_1.ButtonStyle.Success;
                }
            }
            const button = new discord_js_1.ButtonBuilder()
                .setCustomId(`mines_${index}`)
                .setEmoji(emoji)
                .setStyle(style)
                .setDisabled(disabled || game.revealed[index]);
            actionRow.addComponents(button);
        }
        rows.push(actionRow);
    }
    // 5. satır: Cashout butonu
    const cashoutRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('mines_cashout')
        .setLabel('💰 Cashout')
        .setStyle(discord_js_1.ButtonStyle.Success)
        .setDisabled(disabled || game.safeRevealed === 0));
    rows.push(cashoutRow);
    return rows;
}
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('mines')
        .setDescription('Mines oyunu oyna!')
        .addIntegerOption(option => option.setName('miktar')
        .setDescription('Bahis miktarı')
        .setRequired(true)
        .setMinValue(10))
        .addIntegerOption(option => option.setName('mayinlar')
        .setDescription('Mayın sayısı (3-10)')
        .setMinValue(3)
        .setMaxValue(10)),
    async execute(interaction) {
        const amount = interaction.options.getInteger('miktar', true);
        const totalMines = interaction.options.getInteger('mayinlar') || 5;
        const player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
        if (!player) {
            return interaction.reply({
                content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
                ephemeral: true
            });
        }
        if (player.balance < amount) {
            return interaction.reply({
                content: `❌ Yetersiz bakiye! Mevcut: ${player.balance} 🪙`,
                ephemeral: true
            });
        }
        // Aktif oyun kontrolü
        const existingGame = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id));
        if (existingGame.exists()) {
            return interaction.reply({
                content: '❌ Zaten aktif bir Mines oyununuz var!',
                ephemeral: true
            });
        }
        const game = {
            userId: interaction.user.id,
            bet: amount,
            grid: generateGrid(totalMines),
            revealed: new Array(20).fill(false), // 4x5 = 20
            safeRevealed: 0,
            totalMines,
            multiplier: 1.0
        };
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id), game);
        // Bahsi düş
        player.balance -= amount;
        await databaseService_1.databaseService.updatePlayer(player);
        // Quest tracking - Casino spent
        await questService_1.questService.trackCasinoSpent(interaction.user.id, amount);
        const buttons = createGridButtons(game);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('💣 Mines Oyunu')
            .setDescription(`4x5 grid'de **${totalMines} mayın** var!\n\nMayına basmadan kareleri aç ve cashout yap!`)
            .addFields({ name: '💰 Bahis', value: `${amount} 🪙`, inline: true }, { name: '💎 Açılan Kareler', value: '0', inline: true }, { name: '📊 Çarpan', value: '1.00x', inline: true }, { name: '💵 Potansiyel Kazanç', value: `${amount} 🪙`, inline: true })
            .setFooter({ text: 'Karelere tıklayarak aç! Mayına basarsan kaybedersin!' })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], components: buttons });
    },
};
