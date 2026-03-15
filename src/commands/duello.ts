import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { duelService } from '../services/duelService';
import { databaseService } from '../services/databaseService';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duello')
    .setDescription('Düello sistemi')
    .addSubcommand(sub =>
      sub.setName('challenge')
        .setDescription('Düello daveti gönder')
        .addUserOption(opt => opt.setName('rakip').setDescription('Düello yapılacak rakip').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Düello miktarı (bakiye)').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('sonuc')
        .setDescription('Düello sonucunu gir')
        .addStringOption(opt => opt.setName('duello_id').setDescription('Düello ID').setRequired(true))
        .addUserOption(opt => opt.setName('kazanan').setDescription('Kazanan oyuncu').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('rastgele')
        .setDescription('Bir kullanıcıyla rastgele zar at veya yazı tura at')
        .addStringOption(opt => opt.setName('mode').setDescription('Mod seçin').setRequired(true)
          .addChoices(
            { name: 'D2 (1-2)', value: 'd2' },
            { name: 'D5 (1-5)', value: 'd5' },
            { name: 'D10 (1-10)', value: 'd10' },
            { name: 'D25 (1-25)', value: 'd25' },
            { name: 'D50 (1-50)', value: 'd50' },
            { name: 'D100 (1-100)', value: 'd100' },
            { name: 'Yazı Tura', value: 'yazı-tura' }
          ))
        .addUserOption(opt => opt.setName('user').setDescription('Karşılaştırılacak kullanıcı').setRequired(true))
        .addStringOption(opt => opt.setName('tahmin').setDescription('Yazı Tura tahmininiz (sadece yazı-tura modunda)')
          .addChoices(
            { name: '🪙 Yazı', value: 'heads' },
            { name: '🪙 Tura', value: 'tails' }
          ))
        .addIntegerOption(opt => opt.setName('count').setDescription('Kaç defa atılacak (varsayılan: 1, sadece zar için)').setMinValue(1).setMaxValue(10))
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'challenge') {
      const opponent = interaction.options.getUser('rakip', true);
      const amount = interaction.options.getInteger('miktar', true);

      if (opponent.id === interaction.user.id) {
        return interaction.reply({
          content: '❌ Kendinizle düello yapamazsınız!',
          ephemeral: true
        });
      }

      if (opponent.bot) {
        return interaction.reply({
          content: '❌ Botlarla düello yapamazsınız!',
          ephemeral: true
        });
      }

      // Challenger bakiye kontrolü
      const challengerPlayer = await databaseService.getPlayer(interaction.user.id);
      if (!challengerPlayer) {
        return interaction.reply({
          content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
          ephemeral: true
        });
      }

      if (challengerPlayer.balance < amount) {
        return interaction.reply({
          content: `❌ Bakiyeniz yetersiz! Gerekli: ${amount} 🪙, Mevcut: ${challengerPlayer.balance} 🪙`,
          ephemeral: true
        });
      }

      // Opponent bakiye kontrolü
      const opponentPlayer = await databaseService.getPlayer(opponent.id);
      if (!opponentPlayer) {
        return interaction.reply({
          content: `❌ ${opponent.username} henüz kayıt olmamış!`,
          ephemeral: true
        });
      }

      if (opponentPlayer.balance < amount) {
        return interaction.reply({
          content: `❌ ${opponent.username} kullanıcısının bakiyesi yetersiz! (${opponentPlayer.balance} 🪙)`,
          ephemeral: true
        });
      }

      // Aktif düello kontrolü
      const activeDuels = await duelService.getUserActiveDuels(interaction.user.id);
      if (activeDuels.length > 0) {
        return interaction.reply({
          content: '❌ Zaten aktif bir düellonuz var!',
          ephemeral: true
        });
      }

      const opponentActiveDuels = await duelService.getUserActiveDuels(opponent.id);
      if (opponentActiveDuels.length > 0) {
        return interaction.reply({
          content: `❌ ${opponent.username} zaten aktif bir düelloda!`,
          ephemeral: true
        });
      }

      try {
        const { duelService } = await import('../services/duelService');
        const { botStatusService } = await import('../services/botStatusService');
        
        if (botStatusService.isDevMode()) {
          // Test modu - Düello daveti simülasyonu
          await botStatusService.sendToDevChannel(
            interaction.client,
            interaction.guildId!,
            `Düello daveti DM gönderildi: ${opponent.username} kullanıcısına ${amount} 🪙 miktarında`
          );
          await interaction.reply({
            content: `🧪 ${botStatusService.getTestMessage('Düello daveti DM gönderme')} Rakip: ${opponent.username}, Miktar: ${amount} 🪙`,
            ephemeral: true
          });
          return;
        }
        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setTitle('⚔️ Düello Daveti!')
          .setDescription(`<@${interaction.user.id}> sizi düelloya davet etti!`)
          .addFields(
            { name: '💰 Bahis Miktarı', value: `${amount} 🪙`, inline: true },
            { name: '🆔 Düello ID', value: `\`${duel.id}\``, inline: true }
          )
          .setFooter({ text: 'Düelloyu kabul ederseniz, kendi aranızda maç kurup oynayacaksınız.' })
          .setTimestamp();

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`duel_accept_${duel.id}`)
            .setLabel('Kabul Et')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⚔️'),
          new ButtonBuilder()
            .setCustomId(`duel_decline_${duel.id}`)
            .setLabel('Reddet')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );

        await opponent.send({ embeds: [embed], components: [buttons] });

        await interaction.reply({
          content: `✅ ${opponent.username} kullanıcısına düello daveti gönderildi! (${amount} 🪙)`,
          ephemeral: true
        });

      } catch (error) {
        await duelService.deleteDuel(duel.id);
        Logger.error('Düello daveti gönderilemedi', error);
        await interaction.reply({
          content: '❌ Kullanıcıya DM gönderilemedi! DM\'leri kapalı olabilir.',
          ephemeral: true
        });
      }
    }

    else if (subcommand === 'rastgele') {
      const mode = interaction.options.getString('mode', true);
      const targetUser = interaction.options.getUser('user', true);
      const count = interaction.options.getInteger('count') || 1;
      const userGuess = interaction.options.getString('tahmin');

      if (targetUser.id === interaction.user.id) {
        return interaction.reply({
          content: '❌ Kendinizle yarışamazsınız!',
          ephemeral: true
        });
      }

      if (targetUser.bot) {
        return interaction.reply({
          content: '❌ Botlarla yarışamazsınız!',
          ephemeral: true
        });
      }

      if (mode === 'yazı-tura') {
        // Yazı-Tura modu: Bot aklından tutar, kullanıcılar tahmin eder
        
        if (!userGuess) {
          return interaction.reply({
            content: '❌ Yazı-Tura modu için `tahmin` parametresini seçmelisiniz! (Yazı veya Tura)',
            ephemeral: true
          });
        }

        // Bot aklından bir sonuç tutar
        const botResult = Math.random() < 0.5 ? 'heads' : 'tails';
        const botResultText = botResult === 'heads' ? '🪙 Yazı' : '🪙 Tura';
        
        // Kullanıcının tahmini
        const user1GuessText = userGuess === 'heads' ? '🪙 Yazı' : '🪙 Tura';
        
        // Rakibin tahmini (otomatik olarak diğeri)
        const user2Guess = userGuess === 'heads' ? 'tails' : 'heads';
        const user2GuessText = user2Guess === 'heads' ? '🪙 Yazı' : '🪙 Tura';
        
        // Kazananı belirle
        let winner = '';
        let winnerUser = null;
        
        if (userGuess === botResult) {
          winner = `🏆 **Kazanan:** ${interaction.user.username}`;
          winnerUser = interaction.user;
        } else {
          winner = `🏆 **Kazanan:** ${targetUser.username}`;
          winnerUser = targetUser;
        }

        const embed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle('🪙 Yazı Tura Düellosu')
          .setDescription(
            `**Bot'un Sonucu:** ${botResultText}\n\n` +
            `${interaction.user.username} tahmini: ${user1GuessText}\n` +
            `${targetUser.username} tahmini: ${user2GuessText}\n\n` +
            winner
          )
          .setFooter({ text: 'Bot aklından bir yazı-tura attı ve sonuç açıklandı!' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        // Zar modu: Her iki kullanıcı da zar atar
        const maxValue = parseInt(mode.substring(1));
        const user1Results = [];
        const user2Results = [];
        
        for (let i = 0; i < count; i++) {
          user1Results.push(Math.floor(Math.random() * maxValue) + 1);
          user2Results.push(Math.floor(Math.random() * maxValue) + 1);
        }

        const user1Total = user1Results.reduce((a, b) => a + b, 0);
        const user2Total = user2Results.reduce((a, b) => a + b, 0);

        const user1Text = user1Results.map((r, i) => `${i + 1}. 🎲 ${r}`).join('\n');
        const user2Text = user2Results.map((r, i) => `${i + 1}. 🎲 ${r}`).join('\n');

        let winner = '';
        if (user1Total > user2Total) {
          winner = `🏆 **Kazanan:** ${interaction.user.username} (${user1Total} > ${user2Total})`;
        } else if (user2Total > user1Total) {
          winner = `🏆 **Kazanan:** ${targetUser.username} (${user2Total} > ${user1Total})`;
        } else {
          winner = `🤝 **Berabere!** (${user1Total} = ${user2Total})`;
        }

        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setTitle(`🎲 ${mode.toUpperCase()} Düellosu`)
          .addFields(
            { name: `${interaction.user.username}`, value: user1Text, inline: true },
            { name: `${targetUser.username}`, value: user2Text, inline: true }
          )
          .setDescription(winner)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    }

    else if (subcommand === 'sonuc') {
      const duelId = interaction.options.getString('duello_id', true);
      const winner = interaction.options.getUser('kazanan', true);

      const duel = await duelService.getDuel(duelId);
      if (!duel) {
        return interaction.reply({
          content: '❌ Düello bulunamadı!',
          ephemeral: true
        });
      }

      if (duel.status !== 'accepted') {
        return interaction.reply({
          content: '❌ Bu düello henüz kabul edilmemiş veya zaten tamamlanmış!',
          ephemeral: true
        });
      }

      // Sadece düelloya katılanlar sonuç girebilir
      if (interaction.user.id !== duel.challenger && interaction.user.id !== duel.challenged) {
        return interaction.reply({
          content: '❌ Bu düellonun sonucunu girme yetkiniz yok!',
          ephemeral: true
        });
      }

      // Kazanan düelloya katılan biri olmalı
      if (winner.id !== duel.challenger && winner.id !== duel.challenged) {
        return interaction.reply({
          content: '❌ Kazanan düelloya katılan birisi olmalı!',
          ephemeral: true
        });
      }

      // Düelloyu tamamla
      await duelService.completeDuel(duelId, winner.id);

      // Bakiye transferi
      const winnerId = winner.id;
      const loserId = winnerId === duel.challenger ? duel.challenged : duel.challenger;

      const winnerPlayer = await databaseService.getPlayer(winnerId);
      const loserPlayer = await databaseService.getPlayer(loserId);

      if (winnerPlayer && loserPlayer) {
        winnerPlayer.balance += duel.amount;
        loserPlayer.balance -= duel.amount;

        await databaseService.updatePlayer(winnerPlayer);
        await databaseService.updatePlayer(loserPlayer);

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('⚔️ Düello Tamamlandı!')
          .setDescription(`**Kazanan:** <@${winnerId}>`)
          .addFields(
            { name: '💰 Transfer Edilen Miktar', value: `${duel.amount} 🪙`, inline: true },
            { name: '🆔 Düello ID', value: `\`${duelId}\``, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        Logger.success('Düello tamamlandı ve bakiye transfer edildi', { duelId, winnerId, amount: duel.amount });
      } else {
        await interaction.reply({
          content: '❌ Oyuncu verileri güncellenirken hata oluştu!',
          ephemeral: true
        });
      }
    }
  },
};