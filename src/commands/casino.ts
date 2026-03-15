import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../services/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { databaseService } from '../services/databaseService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('casino')
    .setDescription('Casino oyun yönetimi')
    .addSubcommand(subcommand =>
      subcommand
        .setName('iptal')
        .setDescription('Tüm aktif casino oyunlarınızı iptal edin')),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'iptal') {
      const player = await databaseService.getPlayer(interaction.user.id);
      if (!player) {
        return interaction.reply({
          content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
          ephemeral: true
        });
      }

      let cancelledGames: string[] = [];

      // Crash oyunu kontrolü
      const crashGame = await getDoc(doc(db, 'crashGames', interaction.user.id));
      if (crashGame.exists()) {
        const gameData = crashGame.data();
        // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
        // Sadece oyunu sil
        await deleteDoc(doc(db, 'crashGames', interaction.user.id));
        cancelledGames.push(`🚀 Crash`);
      }

      // Mines oyunu kontrolü
      const minesGame = await getDoc(doc(db, 'minesGames', interaction.user.id));
      if (minesGame.exists()) {
        const gameData = minesGame.data();
        // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
        // Sadece oyunu sil
        await deleteDoc(doc(db, 'minesGames', interaction.user.id));
        cancelledGames.push(`💣 Mines`);
      }

      // Blackjack oyunu kontrolü
      const blackjackGame = await getDoc(doc(db, 'blackjackGames', interaction.user.id));
      if (blackjackGame.exists()) {
        const gameData = blackjackGame.data();
        // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
        // Sadece oyunu sil
        await deleteDoc(doc(db, 'blackjackGames', interaction.user.id));
        cancelledGames.push(`🎴 Blackjack`);
      }

      // Slot oyunu kontrolü
      const slotGame = await getDoc(doc(db, 'slotGames', interaction.user.id));
      if (slotGame.exists()) {
        const gameData = slotGame.data();
        // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
        // Sadece oyunu sil
        await deleteDoc(doc(db, 'slotGames', interaction.user.id));
        cancelledGames.push(`🎰 Slot`);
      }

      // Coinflip oyunu kontrolü
      const coinflipGame = await getDoc(doc(db, 'coinflipGames', interaction.user.id));
      if (coinflipGame.exists()) {
        const gameData = coinflipGame.data();
        // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
        // Sadece oyunu sil
        await deleteDoc(doc(db, 'coinflipGames', interaction.user.id));
        cancelledGames.push(`🪙 Coinflip`);
      }

      if (cancelledGames.length === 0) {
        return interaction.reply({
          content: '❌ Aktif bir casino oyununuz bulunmuyor!',
          ephemeral: true
        });
      }

      // Bakiyeyi güncelle
      await databaseService.updatePlayer(player);

      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle('🎰 Casino Oyunları İptal Edildi')
        .setDescription('Tüm aktif oyunlarınız iptal edildi.')
        .addFields(
          { name: '🎮 İptal Edilen Oyunlar', value: cancelledGames.join('\n'), inline: false },
          { name: '💳 Güncel Bakiye', value: `${player.balance} 🪙`, inline: false }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
