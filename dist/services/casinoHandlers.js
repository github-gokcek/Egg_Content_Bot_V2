"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCoinflipButton = handleCoinflipButton;
exports.handleBlackjackButtons = handleBlackjackButtons;
exports.handleCrashCashout = handleCrashCashout;
exports.handleMinesButtons = handleMinesButtons;
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
const messageCleanup_1 = require("../utils/messageCleanup");
const questService_1 = require("./questService");
// Blackjack handler
async function handleCoinflipButton(interaction) {
    const [action, choice, amountStr] = interaction.customId.split('_');
    const amount = parseInt(amountStr);
    const player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
    if (!player) {
        return interaction.reply({ content: '❌ Kayıt bulunamadı!', ephemeral: true });
    }
    // Ev avantajı: %60 bot kazanır
    const houseWins = Math.random() < 0.60;
    let result;
    if (houseWins) {
        result = choice === 'heads' ? 'tails' : 'heads';
    }
    else {
        result = choice;
    }
    const resultText = result === 'heads' ? '🪙 Yazı' : '🪙 Tura';
    const won = result === choice;
    if (won) {
        player.balance += amount * 2;
        await databaseService_1.databaseService.updatePlayer(player);
        await questService_1.questService.trackCasinoWin(interaction.user.id, amount, true);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🎉 Coinflip - Kazandın!')
            .setDescription(`**Sonuç:** ${resultText}`)
            .addFields({ name: '💰 Kazanç', value: `+${amount} 🪙`, inline: true }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true })
            .setTimestamp();
        return interaction.update({ embeds: [embed], components: [] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
    }
    else {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('💸 Coinflip - Kaybettin!')
            .setDescription(`**Sonuç:** ${resultText}`)
            .addFields({ name: '💸 Kayıp', value: `-${amount} 🪙`, inline: true }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true })
            .setTimestamp();
        return interaction.update({ embeds: [embed], components: [] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
    }
}
// Blackjack handler
async function handleBlackjackButtons(interaction) {
    const gameDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'blackjackGames', interaction.user.id));
    if (!gameDoc.exists()) {
        return interaction.reply({
            content: '❌ Aktif bir Blackjack oyununuz yok!',
            ephemeral: true
        });
    }
    const game = gameDoc.data();
    const player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
    if (!player)
        return;
    if (interaction.customId === 'blackjack_hit') {
        // Kart çek
        const newCard = drawCard();
        game.playerHand.push(newCard);
        game.playerValue = calculateValue(game.playerHand);
        if (game.playerValue > 21) {
            // Bust - bahis kaybedildi
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'blackjackGames', interaction.user.id));
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('💥 BUST!')
                .addFields({ name: '🎴 Senin Elin', value: `${formatHand(game.playerHand)}\n**Değer: ${game.playerValue}**`, inline: true }, { name: '🎴 Krupiye', value: `${formatHand(game.dealerHand)}\n**Değer: ${game.dealerValue}**`, inline: true }, { name: '💸 Kayıp', value: `-${game.bet} 🪙`, inline: false }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: false })
                .setTimestamp();
            return interaction.update({ embeds: [embed], components: [] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
        }
        // Oyun devam ediyor
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'blackjackGames', interaction.user.id), game);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('🎴 Blackjack')
            .addFields({ name: '🎴 Senin Elin', value: `${formatHand(game.playerHand)}\n**Değer: ${game.playerValue}**`, inline: true }, { name: '🎴 Krupiye', value: `${formatHand(game.dealerHand, true)}\n**Değer: ?**`, inline: true }, { name: '💰 Bahis', value: `${game.bet} 🪙`, inline: false })
            .setTimestamp();
        return interaction.update({ embeds: [embed] });
    }
    else if (interaction.customId === 'blackjack_stand') {
        // Krupiye oynar
        while (game.dealerValue < 17) {
            game.dealerHand.push(drawCard());
            game.dealerValue = calculateValue(game.dealerHand);
        }
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'blackjackGames', interaction.user.id));
        let result;
        let color;
        let winAmount = 0;
        if (game.dealerValue > 21 || game.playerValue > game.dealerValue) {
            result = '🎉 Kazandın!';
            color = 0x00ff00;
            // Ev avantajı: Kazanıldığında 1.8x ödeme (bahis + 0.8x kazanç)
            winAmount = Math.floor(game.bet * 1.8);
            player.balance += winAmount;
            // Quest tracking - Blackjack win ve casino win
            const { questService } = await Promise.resolve().then(() => __importStar(require('./questService')));
            await questService.trackBlackjackPlay(interaction.user.id, true);
            const netWin = winAmount - game.bet;
            await questService.trackCasinoWin(interaction.user.id, netWin, true);
        }
        else if (game.playerValue === game.dealerValue) {
            result = '🤝 Berabere!';
            color = 0xffff00;
            // Berabere: Bahis iade
            winAmount = game.bet;
            player.balance += winAmount;
        }
        else {
            result = '💸 Kaybettin!';
            color = 0xff0000;
            // Kayıp: Bahis zaten çıkarılmış
        }
        await databaseService_1.databaseService.updatePlayer(player);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(color)
            .setTitle(result)
            .addFields({ name: '🎴 Senin Elin', value: `${formatHand(game.playerHand)}\n**Değer: ${game.playerValue}**`, inline: true }, { name: '🎴 Krupiye', value: `${formatHand(game.dealerHand)}\n**Değer: ${game.dealerValue}**`, inline: true }, { name: '💰 Sonuç', value: winAmount > 0 ? `+${winAmount - game.bet} 🪙` : `-${game.bet} 🪙`, inline: false }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: false })
            .setTimestamp();
        return interaction.update({ embeds: [embed], components: [] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
    }
    else if (interaction.customId === 'blackjack_double') {
        // Mevcut bakiyeyi yeniden kontrol et
        const currentPlayer = await databaseService_1.databaseService.getPlayer(interaction.user.id);
        if (!currentPlayer || currentPlayer.balance < game.bet) {
            return interaction.reply({
                content: '❌ Double için yeterli bakiyeniz yok!',
                ephemeral: true
            });
        }
        // İkinci bahsi çıkar
        currentPlayer.balance -= game.bet;
        game.bet *= 2;
        // Tek kart çek
        const newCard = drawCard();
        game.playerHand.push(newCard);
        game.playerValue = calculateValue(game.playerHand);
        // Krupiye oynar
        while (game.dealerValue < 17) {
            game.dealerHand.push(drawCard());
            game.dealerValue = calculateValue(game.dealerHand);
        }
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'blackjackGames', interaction.user.id));
        let result;
        let color;
        let winAmount = 0;
        if (game.playerValue > 21) {
            result = '💥 BUST!';
            color = 0xff0000;
            // Kayıp: Bahis zaten çıkarılmış
        }
        else if (game.dealerValue > 21 || game.playerValue > game.dealerValue) {
            result = '🎉 Kazandın!';
            color = 0x00ff00;
            // Ev avantajı: Kazanıldığında 1.8x ödeme (bahis + 0.8x kazanç)
            winAmount = Math.floor(game.bet * 1.8);
            currentPlayer.balance += winAmount;
            // Quest tracking - Blackjack win ve casino win
            const { questService } = await Promise.resolve().then(() => __importStar(require('./questService')));
            await questService.trackBlackjackPlay(interaction.user.id, true);
            const netWin = winAmount - game.bet;
            await questService.trackCasinoWin(interaction.user.id, netWin, true);
        }
        else if (game.playerValue === game.dealerValue) {
            result = '🤝 Berabere!';
            color = 0xffff00;
            // Berabere: Bahis iade
            winAmount = game.bet;
            currentPlayer.balance += winAmount;
        }
        else {
            result = '💸 Kaybettin!';
            color = 0xff0000;
            // Kayıp: Bahis zaten çıkarılmış
        }
        await databaseService_1.databaseService.updatePlayer(currentPlayer);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(color)
            .setTitle(`${result} (Double)`)
            .addFields({ name: '🎴 Senin Elin', value: `${formatHand(game.playerHand)}\n**Değer: ${game.playerValue}**`, inline: true }, { name: '🎴 Krupiye', value: `${formatHand(game.dealerHand)}\n**Değer: ${game.dealerValue}**`, inline: true }, { name: '💰 Sonuç', value: winAmount > 0 ? `+${winAmount - game.bet} 🪙` : `-${game.bet} 🪙`, inline: false }, { name: '💳 Yeni Bakiye', value: `${currentPlayer.balance} 🪙`, inline: false })
            .setTimestamp();
        return interaction.update({ embeds: [embed], components: [] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
    }
}
// Crash handler
async function handleCrashCashout(interaction) {
    const gameDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id));
    if (!gameDoc.exists()) {
        return interaction.reply({
            content: '❌ Aktif bir Crash oyununuz yok!',
            ephemeral: true
        });
    }
    const game = gameDoc.data();
    const player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
    if (!player)
        return;
    // Crash oldu mu kontrol et
    if (game.crashed) {
        return interaction.reply({
            content: '❌ Oyun zaten crash oldu! Kaybettiniz.',
            ephemeral: true
        });
    }
    // Mevcut çarpanı hesapla (başlangıçtan itibaren geçen zaman)
    const elapsedMs = Date.now() - game.startTime;
    const elapsedSeconds = elapsedMs / 1000;
    const currentMultiplier = Math.min(1.0 + (elapsedSeconds * 0.01), game.crashPoint);
    // Crash point'e ulaştı mı?
    if (currentMultiplier >= game.crashPoint) {
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id), {
            ...game,
            crashed: true
        });
        return interaction.reply({
            content: '❌ Crash oldu! Kaybettiniz.',
            ephemeral: true
        });
    }
    // Cashout başarılı
    await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id));
    const winAmount = Math.floor(game.bet * currentMultiplier);
    player.balance += winAmount;
    await databaseService_1.databaseService.updatePlayer(player);
    // Quest tracking - Crash cashout ve casino win
    const { questService } = await Promise.resolve().then(() => __importStar(require('./questService')));
    await questService.trackCrashPlay(interaction.user.id);
    const netWin = winAmount - game.bet;
    if (netWin > 0) {
        await questService.trackCasinoWin(interaction.user.id, netWin, true);
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎉 Cashout Başarılı!')
        .setDescription(`${currentMultiplier.toFixed(2)}x'de cashout yaptın!`)
        .addFields({ name: '💰 Bahis', value: `${game.bet} 🪙`, inline: true }, { name: '📊 Çarpan', value: `${currentMultiplier.toFixed(2)}x`, inline: true }, { name: '💵 Kazanç', value: `+${winAmount - game.bet} 🪙`, inline: true }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: false })
        .setFooter({ text: `Crash point: ${game.crashPoint.toFixed(2)}x` })
        .setTimestamp();
    return interaction.update({ embeds: [embed], components: [] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
}
// Mines handler
async function handleMinesButtons(interaction) {
    if (interaction.customId === 'mines_cashout') {
        const gameDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id));
        if (!gameDoc.exists()) {
            return interaction.reply({
                content: '❌ Aktif bir Mines oyununuz yok!',
                ephemeral: true
            });
        }
        const game = gameDoc.data();
        const player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
        if (!player)
            return;
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id));
        const winAmount = Math.floor(game.bet * game.multiplier);
        player.balance += winAmount;
        await databaseService_1.databaseService.updatePlayer(player);
        // Quest tracking - Mines cashout ve casino win
        const { questService } = await Promise.resolve().then(() => __importStar(require('./questService')));
        const netWin = winAmount - game.bet;
        if (netWin > 0) {
            await questService.trackCasinoWin(interaction.user.id, netWin, true);
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('💰 Cashout Başarılı!')
            .addFields({ name: '💰 Bahis', value: `${game.bet} 🪙`, inline: true }, { name: '💎 Açılan Kareler', value: `${game.safeRevealed}`, inline: true }, { name: '📊 Çarpan', value: `${game.multiplier.toFixed(2)}x`, inline: true }, { name: '💵 Kazanç', value: `+${winAmount - game.bet} 🪙`, inline: true }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true })
            .setTimestamp();
        return interaction.update({ embeds: [embed], components: [] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
    }
    // Mine tile click
    const index = parseInt(interaction.customId.split('_')[1]);
    const gameDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id));
    if (!gameDoc.exists()) {
        return interaction.reply({
            content: '❌ Aktif bir Mines oyununuz yok!',
            ephemeral: true
        });
    }
    const game = gameDoc.data();
    const player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
    if (!player)
        return;
    game.revealed[index] = true;
    if (game.grid[index]) {
        // Mine hit! - Bahis kaybedildi
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id));
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('💣 BOOM!')
            .setDescription('Mayına bastın!')
            .addFields({ name: '💸 Kayıp', value: `-${game.bet} 🪙`, inline: true }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true })
            .setTimestamp();
        return interaction.update({ embeds: [embed], components: [] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
    }
    // Safe tile
    game.safeRevealed++;
    game.multiplier = calculateMultiplier(game.safeRevealed, game.totalMines);
    // Quest tracking - Her tile açıldığında
    const { questService } = await Promise.resolve().then(() => __importStar(require('./questService')));
    await questService.trackMinesTiles(interaction.user.id, 1);
    // Tüm güvenli kareler açıldı mı?
    const totalSafeTiles = 20 - game.totalMines;
    if (game.safeRevealed >= totalSafeTiles) {
        // Otomatik cashout
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id));
        const winAmount = Math.floor(game.bet * game.multiplier);
        player.balance += winAmount;
        await databaseService_1.databaseService.updatePlayer(player);
        // Quest tracking - Mines perfect game ve casino win
        const { questService } = await Promise.resolve().then(() => __importStar(require('./questService')));
        const netWin = winAmount - game.bet;
        if (netWin > 0) {
            await questService.trackCasinoWin(interaction.user.id, netWin, true);
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xffd700)
            .setTitle('🏆 Mükemmel Oyun!')
            .setDescription('Tüm güvenli kareleri açtın! Otomatik cashout yapıldı.')
            .addFields({ name: '💰 Bahis', value: `${game.bet} 🪙`, inline: true }, { name: '💎 Açılan Kareler', value: `${game.safeRevealed}/${totalSafeTiles}`, inline: true }, { name: '📊 Çarpan', value: `${game.multiplier.toFixed(2)}x`, inline: true }, { name: '💵 Kazanç', value: `+${winAmount - game.bet} 🪙`, inline: true }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true })
            .setTimestamp();
        return interaction.update({ embeds: [embed], components: [] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
    }
    await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id), game);
    const buttons = createGridButtons(game);
    const potentialWin = Math.floor(game.bet * game.multiplier);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('💣 Mines Oyunu')
        .setDescription(`4x5 grid'de **${game.totalMines} mayın** var!`)
        .addFields({ name: '💰 Bahis', value: `${game.bet} 🪙`, inline: true }, { name: '💎 Açılan Kareler', value: `${game.safeRevealed}`, inline: true }, { name: '📊 Çarpan', value: `${game.multiplier.toFixed(2)}x`, inline: true }, { name: '💵 Potansiyel Kazanç', value: `${potentialWin} 🪙`, inline: true })
        .setTimestamp();
    return interaction.update({ embeds: [embed], components: buttons });
}
// Helper functions
const CARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠️', '♥️', '♦️', '♣️'];
function drawCard() {
    const card = CARDS[Math.floor(Math.random() * CARDS.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    return `${card}${suit}`;
}
function calculateValue(hand) {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
        const rank = card.slice(0, -2);
        if (rank === 'A') {
            aces++;
            value += 11;
        }
        else if (['J', 'Q', 'K'].includes(rank)) {
            value += 10;
        }
        else {
            value += parseInt(rank);
        }
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
}
function formatHand(hand, hideFirst = false) {
    if (hideFirst) {
        return `🂠 ${hand.slice(1).join(' ')}`;
    }
    return hand.join(' ');
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
function createGridButtons(game) {
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
                .setDisabled(game.revealed[index]);
            actionRow.addComponents(button);
        }
        rows.push(actionRow);
    }
    // 5. satır: Cashout butonu
    const cashoutRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('mines_cashout')
        .setLabel('💰 Cashout')
        .setStyle(discord_js_1.ButtonStyle.Success)
        .setDisabled(game.safeRevealed === 0));
    rows.push(cashoutRow);
    return rows;
}
