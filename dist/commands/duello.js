"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const logger_1 = require("../utils/logger");
const activeGames = new Map();
// Yazı tura sonucu
function getCoinflipResult() {
    return Math.random() < 0.5 ? 'heads' : 'tails';
}
// Slot sonucu
function getSlotResult() {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
    const multipliers = {
        '🍒': 1.5,
        '🍋': 2,
        '🍊': 2.5,
        '🍇': 3,
        '💎': 5,
        '7️⃣': 10
    };
    const result = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
    ];
    // 3 eşleşme kontrolü
    if (result[0] === result[1] && result[1] === result[2]) {
        return { symbols: result, multiplier: multipliers[result[0]] };
    }
    // 2 eşleşme kontrolü
    if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        return { symbols: result, multiplier: 1.2 };
    }
    return { symbols: result, multiplier: 0 };
}
module.exports = {
    handleDuelloButton,
    data: new discord_js_1.SlashCommandBuilder()
        .setName('duello')
        .setDescription('Başka bir oyuncuya duello gönder')
        .addSubcommand(sub => sub.setName('casino')
        .setDescription('Casino oyunu ile duello')
        .addStringOption(opt => opt.setName('mode')
        .setDescription('Oyun modu')
        .setRequired(true)
        .addChoices({ name: '🪙 Yazı Tura', value: 'coinflip' }, { name: '🎰 Slot', value: 'slot' }))
        .addUserOption(opt => opt.setName('rakip')
        .setDescription('Duello yapacak oyuncu')
        .setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar')
        .setDescription('Bahis miktarı')
        .setRequired(true)
        .setMinValue(10))
        .addStringOption(opt => opt.setName('secim')
        .setDescription('Yazı tura seçimi (yazı-tura modunda zorunlu)')
        .setRequired(false)
        .addChoices({ name: '🪙 Yazı', value: 'heads' }, { name: '🪙 Tura', value: 'tails' }))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'casino') {
            const mode = interaction.options.getString('mode', true);
            const opponent = interaction.options.getUser('rakip', true);
            const amount = interaction.options.getInteger('miktar', true);
            const choice = interaction.options.getString('secim');
            // Yazı tura modunda seçim zorunlu
            if (mode === 'coinflip' && !choice) {
                return interaction.reply({
                    content: '❌ Yazı Tura modunda seçim (yazı/tura) zorunludur!',
                    ephemeral: true
                });
            }
            // Aynı rakibe birden fazla duello gönderme kontrolü
            const existingDuello = Array.from(activeGames.values()).find(g => (g.challenger === interaction.user.id && g.opponent === opponent.id) ||
                (g.challenger === opponent.id && g.opponent === interaction.user.id));
            if (existingDuello) {
                return interaction.reply({
                    content: '❌ Bu oyuncuyla zaten aktif bir duello var!',
                    ephemeral: true
                });
            }
            // Validasyonlar
            if (opponent.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ Kendinize duello gönderemezsiniz!',
                    ephemeral: true
                });
            }
            if (opponent.bot) {
                return interaction.reply({
                    content: '❌ Bota duello gönderemezsiniz!',
                    ephemeral: true
                });
            }
            // Oyuncuları kontrol et
            let challenger = await databaseService_1.databaseService.getPlayer(interaction.user.id);
            if (!challenger) {
                challenger = {
                    discordId: interaction.user.id,
                    username: interaction.user.username,
                    balance: 0,
                    createdAt: new Date(),
                    stats: { lol: { wins: 0, losses: 0 }, tft: { matches: 0, top4: 0, rankings: [], points: 0 } }
                };
                await databaseService_1.databaseService.savePlayer(challenger);
            }
            let opponentPlayer = await databaseService_1.databaseService.getPlayer(opponent.id);
            if (!opponentPlayer) {
                opponentPlayer = {
                    discordId: opponent.id,
                    username: opponent.username,
                    balance: 0,
                    createdAt: new Date(),
                    stats: { lol: { wins: 0, losses: 0 }, tft: { matches: 0, top4: 0, rankings: [], points: 0 } }
                };
                await databaseService_1.databaseService.savePlayer(opponentPlayer);
            }
            // Bakiye kontrolü
            if (challenger.balance < amount) {
                return interaction.reply({
                    content: `❌ Bakiyeniz yetersiz! Gerekli: ${amount} 🪙, Mevcut: ${challenger.balance} 🪙`,
                    ephemeral: true
                });
            }
            if (opponentPlayer.balance < amount) {
                return interaction.reply({
                    content: `❌ ${opponent.username}'in bakiyesi yetersiz! Gerekli: ${amount} 🪙, Mevcut: ${opponentPlayer.balance} 🪙`,
                    ephemeral: true
                });
            }
            // Duello oluştur
            const gameId = `${interaction.user.id}_${opponent.id}_${Date.now()}`;
            const game = {
                id: gameId,
                challenger: interaction.user.id,
                opponent: opponent.id,
                mode,
                amount,
                createdAt: Date.now(),
                challengerChoice: choice || undefined
            };
            activeGames.set(gameId, game);
            // Embed oluştur
            const modeText = mode === 'coinflip' ? '🪙 Yazı Tura' : '🎰 Slot';
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⚔️ Duello Daveti')
                .setDescription(`${opponent} sana duello daveti geldi!`)
                .addFields({ name: '🎮 Oyun Modu', value: modeText, inline: true }, { name: '💰 Bahis Miktarı', value: `${amount} 🪙`, inline: true }, { name: '👤 Rakip', value: `${interaction.user.username}`, inline: true });
            // Yazı tura modunda seçim bilgisi ekle
            if (mode === 'coinflip') {
                const challengerChoiceText = choice === 'heads' ? '🪙 Yazı' : '🪙 Tura';
                const opponentChoiceText = choice === 'heads' ? '🪙 Tura' : '🪙 Yazı';
                embed.addFields({ name: '🎯 Rakibin Seçimi', value: `${interaction.user.username} **${challengerChoiceText}** seçti\nSen **${opponentChoiceText}** olarak oynayacaksın`, inline: false });
            }
            embed.addFields({ name: '⏰ Süre', value: '1 dakika içinde cevap ver', inline: false })
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();
            // Butonlar
            const row = new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`duello_accept_${gameId}`)
                .setLabel('✅ Kabul Et')
                .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
                .setCustomId(`duello_reject_${gameId}`)
                .setLabel('❌ Reddet')
                .setStyle(discord_js_1.ButtonStyle.Danger));
            const message = await interaction.reply({
                content: `${opponent}`,
                embeds: [embed],
                components: [row]
            });
            game.messageId = message.id;
            game.channelId = interaction.channelId;
            // Geriye sayma (1 dakika = 60 saniye)
            let remainingTime = 60;
            const countdownInterval = setInterval(async () => {
                remainingTime--;
                if (remainingTime <= 0) {
                    clearInterval(countdownInterval);
                    activeGames.delete(gameId);
                    try {
                        await message.delete();
                    }
                    catch (error) {
                        logger_1.Logger.error('Duello mesajı silinemedi', error);
                    }
                    return;
                }
                // Duello kabul edilmişse interval'i durdur
                if (!activeGames.has(gameId)) {
                    clearInterval(countdownInterval);
                    return;
                }
                // Embed'i güncelle
                const updatedEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0xFFD700)
                    .setTitle('⚔️ Duello Daveti')
                    .setDescription(`${opponent} sana duello daveti geldi!`)
                    .addFields({ name: '🎮 Oyun Modu', value: modeText, inline: true }, { name: '💰 Bahis Miktarı', value: `${amount} 🪙`, inline: true }, { name: '👤 Rakip', value: `${interaction.user.username}`, inline: true });
                // Yazı tura modunda seçim bilgisi ekle
                if (mode === 'coinflip') {
                    const challengerChoiceText = choice === 'heads' ? '🪙 Yazı' : '🪙 Tura';
                    const opponentChoiceText = choice === 'heads' ? '🪙 Tura' : '🪙 Yazı';
                    updatedEmbed.addFields({ name: '🎯 Rakibin Seçimi', value: `${interaction.user.username} **${challengerChoiceText}** seçti\nSen **${opponentChoiceText}** olarak oynayacaksın`, inline: false });
                }
                updatedEmbed.addFields({ name: '⏰ Kalan Süre', value: `${remainingTime} saniye`, inline: false })
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();
                try {
                    await message.edit({ embeds: [updatedEmbed] });
                }
                catch (error) {
                    logger_1.Logger.error('Duello embed güncellenemedi', error);
                    clearInterval(countdownInterval);
                    activeGames.delete(gameId);
                }
            }, 1000); // Her 1 saniyede bir güncelle
            game.countdownInterval = countdownInterval;
        }
    }
};
// Button handler (interactionCreate event'inde çağrılacak)
async function handleDuelloButton(interaction) {
    if (!interaction.isButton())
        return;
    const customId = interaction.customId;
    if (customId.startsWith('duello_accept_')) {
        const gameId = customId.replace('duello_accept_', '');
        const game = activeGames.get(gameId);
        if (!game) {
            return interaction.reply({
                content: '❌ Bu duello artık geçersiz!',
                ephemeral: true
            });
        }
        if (interaction.user.id !== game.opponent) {
            return interaction.reply({
                content: '❌ Bu duelloya sadece davet edilen kişi cevap verebilir!',
                ephemeral: true
            });
        }
        // Çift tıklama önleme
        if (game.isProcessing) {
            return interaction.reply({
                content: '❌ Duello zaten işleniyor, lütfen bekleyin!',
                ephemeral: true
            });
        }
        game.isProcessing = true;
        // Geriye sayma interval'ini temizle
        if (game.countdownInterval) {
            clearInterval(game.countdownInterval);
        }
        activeGames.delete(gameId);
        // Oyuncuları getir
        let challenger = await databaseService_1.databaseService.getPlayer(game.challenger);
        let opponent = await databaseService_1.databaseService.getPlayer(game.opponent);
        if (!challenger || !opponent) {
            return interaction.reply({
                content: '❌ Oyuncu bilgileri getirilemedi!',
                ephemeral: true
            });
        }
        // Bakiye kontrolü (tekrar)
        if (challenger.balance < game.amount || opponent.balance < game.amount) {
            return interaction.reply({
                content: '❌ Birinin bakiyesi yetersiz hale geldi!',
                ephemeral: true
            });
        }
        let winner;
        let result;
        if (game.mode === 'coinflip') {
            const result1 = getCoinflipResult();
            const result2 = game.challengerChoice === 'heads' ? 'heads' : 'tails';
            const opponentChoice = game.challengerChoice === 'heads' ? 'tails' : 'heads';
            winner = result1 === result2 ? game.challenger : game.opponent;
            const result1Text = result1 === 'heads' ? '🪙 Yazı' : '🪙 Tura';
            const result2Text = result2 === 'heads' ? '🪙 Yazı' : '🪙 Tura';
            const opponentChoiceText = opponentChoice === 'heads' ? '🪙 Yazı' : '🪙 Tura';
            result = `**Sonuç:** ${result1Text}\n${interaction.client.users.cache.get(game.challenger)?.username || 'Bilinmeyen'}: ${result2Text}\n${interaction.client.users.cache.get(game.opponent)?.username || 'Bilinmeyen'}: ${opponentChoiceText}`;
        }
        else {
            const slot1 = getSlotResult();
            const slot2 = getSlotResult();
            const win1 = slot1.multiplier > 0;
            const win2 = slot2.multiplier > 0;
            if (win1 && !win2) {
                winner = game.challenger;
            }
            else if (win2 && !win1) {
                winner = game.opponent;
            }
            else if (win1 && win2) {
                winner = slot1.multiplier > slot2.multiplier ? game.challenger : game.opponent;
            }
            else {
                winner = Math.random() < 0.5 ? game.challenger : game.opponent;
            }
            result = `${slot1.symbols.join('')} (${slot1.multiplier}x) vs ${slot2.symbols.join('')} (${slot2.multiplier}x)`;
        }
        // Para transferi (90% kazanan, 10% sistem)
        const winnerReward = Math.floor(game.amount * 0.9);
        const loser = winner === game.challenger ? game.opponent : game.challenger;
        if (winner === game.challenger) {
            challenger.balance += winnerReward;
            opponent.balance -= game.amount;
        }
        else {
            opponent.balance += winnerReward;
            challenger.balance -= game.amount;
        }
        await databaseService_1.databaseService.updatePlayer(challenger);
        await databaseService_1.databaseService.updatePlayer(opponent);
        // Sonuç embed'i
        const winnerUser = winner === game.challenger ? interaction.client.users.cache.get(game.challenger) : interaction.client.users.cache.get(game.opponent);
        const loserUser = winner === game.challenger ? interaction.client.users.cache.get(game.opponent) : interaction.client.users.cache.get(game.challenger);
        const resultEmbed = new discord_js_1.EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 Duello Sonucu')
            .setDescription(`**${winnerUser?.username || 'Bilinmeyen'}** kazandı!`)
            .addFields({ name: '🎮 Oyun Modu', value: game.mode === 'coinflip' ? '🪙 Yazı Tura' : '🎰 Slot', inline: true }, { name: '📊 Sonuç', value: result, inline: true }, { name: '💰 Bahis Miktarı', value: `${game.amount} 🪙`, inline: true }, { name: '🏆 Kazanan', value: `${winnerUser?.username || 'Bilinmeyen'} +${winnerReward} 🪙`, inline: true }, { name: '😢 Kaybeden', value: `${loserUser?.username || 'Bilinmeyen'} -${game.amount} 🪙`, inline: true }, { name: '🔥 Sistem Kesintisi', value: `${game.amount - winnerReward} 🪙`, inline: true })
            .setTimestamp();
        await interaction.update({ embeds: [resultEmbed], components: [] });
        logger_1.Logger.success('Duello tamamlandı', { gameId, winner, amount: game.amount });
    }
    else if (customId.startsWith('duello_reject_')) {
        const gameId = customId.replace('duello_reject_', '');
        const game = activeGames.get(gameId);
        if (!game) {
            return interaction.reply({
                content: '❌ Bu duello artık geçersiz!',
                ephemeral: true
            });
        }
        if (interaction.user.id !== game.opponent) {
            return interaction.reply({
                content: '❌ Bu duelloya sadece davet edilen kişi cevap verebilir!',
                ephemeral: true
            });
        }
        // Geriye sayma interval'ini temizle
        if (game.countdownInterval) {
            clearInterval(game.countdownInterval);
        }
        activeGames.delete(gameId);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Duello Reddedildi')
            .setDescription(`${interaction.user.username} duellonuzu reddetti.`)
            .setTimestamp();
        await interaction.update({ embeds: [embed], components: [] });
    }
}
