import { Events, Interaction, EmbedBuilder as DiscordEmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { matchService } from '../services/matchService';
import { LolMode, LolRole, Team, TftMode } from '../types';
import { EmbedBuilder } from '../utils/embedBuilder';
import { ComponentBuilder } from '../utils/componentBuilder';
import { Logger } from '../utils/logger';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { handleBlackjackButtons, handleCrashCashout, handleMinesButtons } from '../services/casinoHandlers';
import { handleDuelloButton } from '../commands/duello';

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    // Context Menu Commands (mesaja sağ tık)
    if (interaction.isMessageContextMenuCommand()) {
      const command = (interaction.client as any).commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        Logger.error('Context menu komut hatası', error);
        const reply = { content: 'Komut çalıştırılırken hata oluştu!', flags: 64 };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
          } else {
            await interaction.reply(reply);
          }
        } catch (replyError) {
          Logger.error('Hata mesajı gönderilemedi', replyError);
        }
      }
      return;
    }

    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = (interaction.client as any).commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        Logger.error('Komut hatası', error);
        const reply = { content: 'Komut çalıştırılırken hata oluştu!', flags: 64 };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
          } else {
            await interaction.reply(reply);
          }
        } catch (replyError) {
          Logger.error('Hata mesajı gönderilemedi', replyError);
        }
      }
    }

    // Select Menu
    if (interaction.isStringSelectMenu()) {
      // Faction Store
      if (interaction.customId === 'faction_store_select') {
        const itemId = interaction.values[0];
        const { factionService } = await import('../services/factionService');
        
        const userFaction = await factionService.getUserFaction(interaction.user.id);
        if (!userFaction) {
          return interaction.update({ content: '❌ Bir faction\'a üye değilsiniz!', components: [] });
        }

        // Find item
        const STORE_ITEMS: any = {
          demacia: [
            { id: 'demacia_badge', name: '⚔️ Demacia Badge', fpCost: 100 },
            { id: 'demacia_title', name: '👑 Demacia Title', fpCost: 200 },
          ],
          bilgewater: [
            { id: 'bilgewater_badge', name: '🏴☠️ Bilgewater Badge', fpCost: 100 },
            { id: 'bilgewater_title', name: '☠️ Bilgewater Title', fpCost: 200 },
          ],
        };

        const items = STORE_ITEMS[userFaction.factionType];
        const item = items.find((i: any) => i.id === itemId);

        if (!item) {
          return interaction.update({ content: '❌ Ürün bulunamadı!', components: [] });
        }

        // Check FP
        if (userFaction.factionPoints < item.fpCost) {
          return interaction.update({ 
            content: `❌ Yetersiz FP! Gerekli: ${item.fpCost} FP, Mevcut: ${userFaction.factionPoints} FP`, 
            components: [] 
          });
        }

        // Deduct FP
        const { db } = await import('../services/firebase');
        const { doc, updateDoc, increment } = await import('firebase/firestore');
        await updateDoc(doc(db, 'userFactions', interaction.user.id), {
          factionPoints: increment(-item.fpCost),
        });

        // TODO: Give item (badge/title role)
        
        await interaction.update({ 
          content: `✅ **${item.name}** satın alındı! (${item.fpCost} FP harcandı)`, 
          components: [] 
        });
        return;
      }

      if (interaction.customId === 'select_game_mode') {
        try {
          const value = interaction.values[0];
          
          if (value.startsWith('lol_')) {
            const mode = value === 'lol_summoners_rift' ? LolMode.SUMMONERS_RIFT : LolMode.ARAM;
            const match = await matchService.createLolMatch(mode, interaction.user.id, interaction.channelId!);
            
            const embed = EmbedBuilder.createLolMatchEmbed(match);
            const buttons = ComponentBuilder.createLolTeamButtons(mode);

            const channel = interaction.channel;
            if (!channel) {
              return interaction.reply({ content: '❌ Kanal bulunamadı!', ephemeral: true });
            }

            const message = await channel.send({
              embeds: [embed],
              components: buttons
            });

            match.messageId = message.id;
            
            await interaction.update({
              content: '✅ Maç oluşturuldu!',
              components: []
            });

            Logger.success('Maç mesajı gönderildi', { matchId: match.id, messageId: message.id });
          }
          else if (value.startsWith('tft_')) {
            const mode = value === 'tft_solo' ? TftMode.SOLO : TftMode.DOUBLE;
            const match = await matchService.createTftMatch(mode, interaction.user.id, interaction.channelId!);
            
            const embed = EmbedBuilder.createTftMatchEmbed(match);
            const buttons = ComponentBuilder.createTftButtons(mode === TftMode.DOUBLE ? 'double' : 'solo');

            const channel = interaction.channel;
            if (!channel) {
              return interaction.reply({ content: '❌ Kanal bulunamadı!', ephemeral: true });
            }

            const message = await channel.send({
              embeds: [embed],
              components: buttons
            });

            match.messageId = message.id;
            
            await interaction.update({
              content: '✅ Maç oluşturuldu!',
              components: []
            });

            Logger.success('TFT maç mesajı gönderildi', { matchId: match.id, messageId: message.id });
          }
        } catch (error) {
          Logger.error('Select menu hatası', error);
          await interaction.reply({ content: '❌ Maç oluşturulurken hata oluştu!', ephemeral: true }).catch(() => {});
        }
      }
    }

    // Buttons
    if (interaction.isButton()) {
      // Duello buttons
      if (interaction.customId.startsWith('duello_')) {
        return handleDuelloButton(interaction);
      }
      
      // Casino game buttons
      if (interaction.customId.startsWith('blackjack_')) {
        return handleBlackjackButtons(interaction);
      }
      if (interaction.customId === 'crash_cashout') {
        return handleCrashCashout(interaction);
      }
      if (interaction.customId.startsWith('mines_')) {
        return handleMinesButtons(interaction);
      }

      // Rol seçim butonları
      if (interaction.customId.startsWith('role_')) {
        const roleId = interaction.customId.replace('role_', '');
        
        if (!interaction.guild || !interaction.member) {
          return interaction.reply({ content: '❌ Bu komut sadece sunucularda kullanılabilir!', ephemeral: true });
        }

        try {
          const member = interaction.member as any;
          const hasRole = member.roles.cache.has(roleId);

          if (hasRole) {
            await member.roles.remove(roleId);
            const role = await interaction.guild.roles.fetch(roleId);
            return interaction.reply({ 
              content: `✅ **${role?.name}** rolü çıkarıldı!`, 
              ephemeral: true 
            });
          } else {
            await member.roles.add(roleId);
            const role = await interaction.guild.roles.fetch(roleId);
            return interaction.reply({ 
              content: `✅ **${role?.name}** rolü verildi!`, 
              ephemeral: true 
            });
          }
        } catch (error) {
          Logger.error('Rol verilemedi', error);
          return interaction.reply({ 
            content: '❌ Rol verilirken hata oluştu! Botun rol yetkisi olduğundan emin olun.', 
            ephemeral: true 
          });
        }
      }

      // Düello davet butonları
      if (interaction.customId.startsWith('duel_accept_') || interaction.customId.startsWith('duel_decline_')) {
        const duelId = interaction.customId.replace('duel_accept_', '').replace('duel_decline_', '');
        const { duelService } = await import('../services/duelService');
        
        const duel = await duelService.getDuel(duelId);
        if (!duel) {
          return interaction.update({ content: '❌ Bu düello artık geçerli değil!', components: [] });
        }

        if (duel.challenged !== interaction.user.id) {
          return interaction.reply({ content: '❌ Bu düello size ait değil!', ephemeral: true });
        }

        if (interaction.customId.startsWith('duel_accept_')) {
          await duelService.acceptDuel(duelId);
          await interaction.update({ 
            content: `✅ Düelloyu kabul ettiniz! Artık kendi aranızda maç kurup oynayabilirsiniz.\n**Düello ID:** \`${duelId}\`\n**Bahis:** ${duel.amount} 🪙\n\nMaç bitince \`/duello sonuc\` komutu ile sonucu girin.`,
            components: [] 
          });
          Logger.success('Düello kabul edildi', { duelId, challenged: interaction.user.id });
        } else {
          await duelService.cancelDuel(duelId);
          await interaction.update({ content: '❌ Düelloyu reddettiniz.', components: [] });
          Logger.info('Düello reddedildi', { duelId, challenged: interaction.user.id });
        }
        return;
      }

      // Grup davet butonları
      if (interaction.customId.startsWith('group_accept_') || interaction.customId.startsWith('group_decline_')) {
        const inviteId = interaction.customId.replace('group_accept_', '').replace('group_decline_', '');
        const { inviteService } = await import('../services/inviteService');
        const { groupService } = await import('../services/groupService');
        
        const invite = await inviteService.getInvite(inviteId);
        if (!invite) {
          return interaction.update({ content: '❌ Bu davet artık geçerli değil!', components: [] });
        }

        if (invite.invitedUserId !== interaction.user.id) {
          return interaction.reply({ content: '❌ Bu davet size ait değil!', ephemeral: true });
        }

        if (interaction.customId.startsWith('group_accept_')) {
          try {
            const group = await groupService.getGroup(invite.groupId);
            if (!group) {
              await inviteService.deleteInvite(inviteId);
              return interaction.update({ content: '❌ Grup artık mevcut değil!', components: [] });
            }

            await groupService.addMember(invite.groupId, interaction.user.id);
            await inviteService.deleteInvite(inviteId);
            
            await interaction.update({ 
              content: `✅ **${group.name}** grubuna katıldınız!`,
              components: [] 
            });
            
            Logger.success('Grup daveti kabul edildi', { groupId: invite.groupId, userId: interaction.user.id });
          } catch (error: any) {
            await interaction.update({ content: `❌ ${error.message}`, components: [] });
          }
        } else {
          await inviteService.deleteInvite(inviteId);
          await interaction.update({ content: '❌ Grup davetini reddettiniz.', components: [] });
          Logger.info('Grup daveti reddedildi', { groupId: invite.groupId, userId: interaction.user.id });
        }
        return;
      }

      // Sayfalama butonları için handler
      if (interaction.customId.startsWith('players_page_')) {
        const page = parseInt(interaction.customId.replace('players_page_', ''));
        
        try {
          const playersPerPage = 10;
          const startIndex = (page - 1) * playersPerPage;

          const playersQuery = query(
            collection(db, 'players'),
            orderBy('discordId', 'asc')
          );
          
          const snapshot = await getDocs(playersQuery);
          const allPlayers = snapshot.docs.map(doc => doc.data());
          const totalPlayers = allPlayers.length;
          const totalPages = Math.ceil(totalPlayers / playersPerPage);
          const playersOnPage = allPlayers.slice(startIndex, startIndex + playersPerPage);

          const embed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle('👥 Kayıtlı Oyuncular')
            .setDescription(`Toplam **${totalPlayers}** oyuncu kayıtlı`)
            .setFooter({ text: `Sayfa ${page}/${totalPages}` })
            .setTimestamp();

          let playersList = '';
          
          for (let i = 0; i < playersOnPage.length; i++) {
            const player = playersOnPage[i];
            const playerNumber = startIndex + i + 1;
            
            try {
              const user = await interaction.client.users.fetch(player.discordId);
              const username = user.username;
              
              playersList += `**${playerNumber}.** ${username}\n`;
              playersList += `├ 🎮 **LoL:** ${player.lolIgn || 'Belirtilmemiş'}\n`;
              playersList += `├ ♟️ **TFT:** ${player.tftIgn || 'Belirtilmemiş'}\n`;
              playersList += `└ 💰 **Bakiye:** ${player.balance || 0} 🪙\n\n`;
            } catch (error) {
              playersList += `**${playerNumber}.** Bilinmeyen Kullanıcı (${player.discordId})\n`;
              playersList += `├ 🎮 **LoL:** ${player.lolIgn || 'Belirtilmemiş'}\n`;
              playersList += `├ ♟️ **TFT:** ${player.tftIgn || 'Belirtilmemiş'}\n`;
              playersList += `└ 💰 **Bakiye:** ${player.balance || 0} 🪙\n\n`;
            }
          }

          embed.addFields({
            name: '📋 Oyuncu Listesi',
            value: playersList || 'Oyuncu bulunamadı',
            inline: false
          });

          const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
          const buttons = new ActionRowBuilder<ButtonBuilder>();
          
          if (page > 1) {
            buttons.addComponents(
              new ButtonBuilder()
                .setCustomId(`players_page_${page - 1}`)
                .setLabel('◀️ Önceki')
                .setStyle(ButtonStyle.Primary)
            );
          }
          
          if (page < totalPages) {
            buttons.addComponents(
              new ButtonBuilder()
                .setCustomId(`players_page_${page + 1}`)
                .setLabel('Sonraki ▶️')
                .setStyle(ButtonStyle.Primary)
            );
          }

          const components = buttons.components.length > 0 ? [buttons] : [];
          
          await interaction.update({ 
            embeds: [embed], 
            components 
          });
          
        } catch (error) {
          console.error('Sayfa değiştirme hatası:', error);
          await interaction.reply({ content: '❌ Sayfa değiştirilirken hata oluştu!', ephemeral: true });
        }
        return;
      }
      // İzleme butonları için handler ekle
      if (interaction.customId.startsWith('watch_')) {
        const [action, team, matchId] = interaction.customId.split('_');
        const match = await matchService.getLolMatch(matchId);
        
        if (!match || match.status !== 'active') {
          return interaction.reply({ content: '❌ Bu maç aktif değil!', ephemeral: true });
        }

        if (interaction.guild) {
          const categoryName = `🎮 Maç #${matchId}`;
          const category = interaction.guild.channels.cache.find(c => c.name === categoryName && c.type === 4);
          
          if (category) {
            const channelName = team === 'blue' ? '🔵 Mavi Takım' : '🔴 Kırmızı Takım';
            const voiceChannel = interaction.guild.channels.cache.find(c => 
              c.name === channelName && c.parentId === category.id && c.type === 2
            );
            
            if (voiceChannel && voiceChannel.isVoiceBased()) {
              // Kanal limitini +1 artır
              const currentLimit = voiceChannel.userLimit || 5;
              await voiceChannel.setUserLimit(currentLimit + 1);
              
              // İzleyici iznini ver (mikrofon kapalı)
              await voiceChannel.permissionOverwrites.create(interaction.user.id, {
                Connect: true,
                Speak: false // İzleyici konuşamaz
              });
              
              const member = await interaction.guild.members.fetch(interaction.user.id);
              if (member.voice.channel) {
                await member.voice.setChannel(voiceChannel);
                // Mikrofonu kapat
                await member.voice.setMute(true);
              }
              
              const teamName = team === 'blue' ? 'Mavi Takım' : 'Kırmızı Takım';
              await interaction.reply({ content: `✅ ${teamName}ını izlemeye başladınız! (Mikrofon kapalı)`, ephemeral: true });
            } else {
              await interaction.reply({ content: '❌ Ses kanalı bulunamadı!', ephemeral: true });
            }
          } else {
            await interaction.reply({ content: '❌ Maç kanalları bulunamadı!', ephemeral: true });
          }
        }
        return;
      }

      // TFT Buttons
      if (interaction.customId.startsWith('tft_')) {
        const tftMatchId = await findTftMatchByMessage(interaction.message.id);
        if (!tftMatchId) {
          return interaction.reply({ content: '❌ Maç bulunamadı!', ephemeral: true });
        }

        const tftMatch = await matchService.getTftMatch(tftMatchId);
        if (!tftMatch) {
          return interaction.reply({ content: '❌ Maç bulunamadı!', ephemeral: true });
        }

        if (tftMatch.status !== 'waiting') {
          return interaction.reply({ content: '❌ Bu maç zaten başladı!', ephemeral: true });
        }

        if (interaction.customId === 'tft_join') {
          // Solo mod kontrolü
          if (tftMatch.mode === TftMode.DOUBLE) {
            return interaction.reply({ content: '❌ Double Up modunda takım seçmelisiniz!', ephemeral: true });
          }
          
          const added = await matchService.addPlayerToTftMatch(tftMatchId, interaction.user.id, false);
          if (!added) {
            return interaction.reply({ content: '❌ Oyuna katılamadınız! (Dolu veya zaten oyundayısınız)', ephemeral: true });
          }
          await updateTftMatchMessage(interaction, tftMatch);
          await interaction.reply({ content: '✅ Oyuna katıldınız!', ephemeral: true });

        // 8 kişi doldu mu?
        if (await matchService.isTftMatchFull(tftMatchId)) {
          await matchService.startTftMatch(tftMatchId);
          
          // Eski mesajı sil ve yeni "oyun başladı" mesajı at
          await interaction.message.delete();
          
          const startedEmbed = EmbedBuilder.createTftMatchStartedEmbed(tftMatch);
          
          const startedMessage = await interaction.channel!.send({
            embeds: [startedEmbed]
          });
          
          tftMatch.messageId = startedMessage.id;
          
          const thread = await startedMessage.startThread({
            name: `♟️ TFT Maç #${tftMatch.id}`,
            autoArchiveDuration: 60
          });
          tftMatch.threadId = thread.id;
          
          // TFT ses kanalı oluştur
          if (interaction.guild) {
            const { voiceService } = await import('../services/voiceService');
            const channel = await voiceService.createTftVoiceChannel(interaction.guild, tftMatch.id, tftMatch.players);
            if (channel) {
              await voiceService.movePlayersToTftChannel(interaction.guild, tftMatch.players, channel);
            }
          }
          
          // Aktif oyun kanalına bildirim gönder
          const { configService } = await import('../services/configService');
          const gameChannelId = await configService.getGameChannel(interaction.guildId!, 'tft');
          if (gameChannelId && gameChannelId !== interaction.channelId) {
            const gameChannel = await interaction.client.channels.fetch(gameChannelId);
            if (gameChannel?.isTextBased()) {
              await gameChannel.send({
                embeds: [startedEmbed]
              });
            }
          }
          
          await thread.send('♟️ **TFT maçı başladı! Ses kanalınıza taşındınız. İyi oyunlar!**');
          Logger.success('TFT maçı başladı', { matchId: tftMatchId, threadId: thread.id });
        }
        }
        else if (interaction.customId.startsWith('tft_join_team')) {
          // Double Up takım katılma
          if (tftMatch.mode !== TftMode.DOUBLE) {
            return interaction.reply({ content: '❌ Bu sadece Double Up modu için!', ephemeral: true });
          }

          const userGroup = await (await import('../services/groupService')).groupService.getUserGroup(interaction.user.id);
          if (!userGroup) {
            return interaction.reply({ content: '❌ Double Up için grup oluşturmalısınız! `/grup olustur` kullanın.', ephemeral: true });
          }

          if (userGroup.members.length !== 2) {
            return interaction.reply({ 
              content: `❌ Double Up için grup tam olarak 2 kişi olmalı! Şu anki grup: ${userGroup.members.length} kişi\n\n**Çözüm:**\n• Grup 3+ kişiyse: Fazla üyeleri çıkarın\n• Grup 1 kişiyse: 1 kişi daha davet edin`, 
              ephemeral: true 
            });
          }

          // Grup zaten başka takımda mı kontrol et
          for (let i = 1; i <= 4; i++) {
            const checkTeamKey = `team${i}` as 'team1' | 'team2' | 'team3' | 'team4';
            const checkTeamMembers = tftMatch.teams![checkTeamKey];
            if (checkTeamMembers) {
              for (const memberId of userGroup.members) {
                if (checkTeamMembers.includes(memberId)) {
                  return interaction.reply({ content: `❌ **${userGroup.name}** grubu zaten ${i}. takımda!`, ephemeral: true });
                }
              }
            }
          }

          const teamNum = interaction.customId.replace('tft_join_team', '');
          const teamKey = `team${teamNum}` as 'team1' | 'team2' | 'team3' | 'team4';

          if (tftMatch.teams![teamKey]) {
            return interaction.reply({ content: '❌ Bu takım dolu!', ephemeral: true });
          }

          // Grubu takıma ekle
          tftMatch.teams![teamKey] = userGroup.members;
          await updateTftMatchMessage(interaction, tftMatch);
          await interaction.reply({ content: `✅ **${userGroup.name}** grubu ${teamNum}. takıma katıldı!`, ephemeral: true });

          // 4 takım doldu mu?
          const filledTeams = Object.values(tftMatch.teams!).filter(t => t !== undefined).length;
          if (filledTeams === 4) {
            tftMatch.status = 'active';
            await updateTftMatchMessage(interaction, tftMatch);
            
            const thread = await interaction.message.startThread({
              name: `♟️ TFT Double Up #${tftMatch.id}`,
              autoArchiveDuration: 60
            });
            tftMatch.threadId = thread.id;
            
            // Double Up ses kanalları oluştur (takım bazında)
            if (interaction.guild) {
              const { voiceService } = await import('../services/voiceService');
              const category = await interaction.guild.channels.create({
                name: `♟️ TFT Double Up #${tftMatch.id}`,
                type: 4 // Category
              });

              // Her takım için ayrı kanal
              const teamChannels = [];
              for (let i = 1; i <= 4; i++) {
                const teamKey = `team${i}` as 'team1' | 'team2' | 'team3' | 'team4';
                const teamMembers = tftMatch.teams![teamKey];
                if (teamMembers) {
                  const channel = await interaction.guild.channels.create({
                    name: `🥇 ${i}. Takım`,
                    type: 2, // Voice
                    parent: category,
                    permissionOverwrites: [
                      {
                        id: interaction.guild.roles.everyone,
                        deny: ['Connect']
                      },
                      ...teamMembers.map(memberId => ({
                        id: memberId,
                        allow: ['Connect', 'Speak']
                      }))
                    ]
                  });
                  teamChannels.push({ channel, members: teamMembers });
                }
              }

              // Oyuncuları kanallarına taşı
              for (const { channel, members } of teamChannels) {
                for (const memberId of members) {
                  const member = await interaction.guild.members.fetch(memberId).catch(() => null);
                  if (member?.voice.channel) {
                    await member.voice.setChannel(channel);
                  }
                }
              }
            }
            
            await thread.send('♟️ **TFT Double Up maçı başladı! Takım ses kanallarınıza taşındınız. İyi oyunlar!**');
            Logger.success('TFT Double Up başladı', { matchId: tftMatchId });
          }
        }
        else if (interaction.customId === 'tft_join_reserve') {
          const added = await matchService.addPlayerToTftMatch(tftMatchId, interaction.user.id, true);
          if (!added) {
            return interaction.reply({ content: '❌ Yedek olarak katılamadınız!', ephemeral: true });
          }
          await updateTftMatchMessage(interaction, tftMatch);
          await interaction.reply({ content: '✅ Yedek olarak katıldınız!', ephemeral: true });
        }
        else if (interaction.customId === 'tft_leave') {
          if (tftMatch.mode === TftMode.DOUBLE) {
            // Double Up - grup bazlı çıkma
            const userGroup = await (await import('../services/groupService')).groupService.getUserGroup(interaction.user.id);
            if (!userGroup) {
              return interaction.reply({ content: '❌ Bir grupta değilsiniz!', ephemeral: true });
            }

            // Hangi takımda olduğumuzu bul
            let teamFound = false;
            for (let i = 1; i <= 4; i++) {
              const teamKey = `team${i}` as 'team1' | 'team2' | 'team3' | 'team4';
              const teamMembers = tftMatch.teams![teamKey];
              if (teamMembers && teamMembers.includes(interaction.user.id)) {
                tftMatch.teams![teamKey] = undefined;
                teamFound = true;
                break;
              }
            }

            if (!teamFound) {
              return interaction.reply({ content: '❌ Bu maçta değilsiniz!', ephemeral: true });
            }

            await updateTftMatchMessage(interaction, tftMatch);
            await interaction.reply({ content: `✅ **${userGroup.name}** grubu maçtan ayrıldı!`, ephemeral: true });
          } else {
            // Solo - normal çıkma
            const removed = await matchService.removePlayerFromTftMatch(tftMatchId, interaction.user.id);
            if (!removed) {
              return interaction.reply({ content: '❌ Bu maçta değilsiniz!', ephemeral: true });
            }
            await updateTftMatchMessage(interaction, tftMatch);
            await interaction.reply({ content: '✅ Maçtan ayrıldınız!', ephemeral: true });
          }
        }
        else if (interaction.customId === 'tft_force_start') {
          // Admin kontrolü
          const isAdmin = interaction.memberPermissions?.has('Administrator');
          if (!isAdmin) {
            return interaction.reply({ content: '❌ Sadece adminler maçı başlatabilir!', ephemeral: true });
          }

          if (tftMatch.players.length < 2) {
            return interaction.reply({ content: '❌ En az 2 oyuncu gerekli!', ephemeral: true });
          }

          tftMatch.status = 'active';
          await updateTftMatchMessage(interaction, tftMatch);
          
          // TFT ses kanalı oluştur
          if (interaction.guild) {
            const { voiceService } = await import('../services/voiceService');
            const channel = await voiceService.createTftVoiceChannel(interaction.guild, tftMatch.id, tftMatch.players);
            if (channel) {
              await voiceService.movePlayersToTftChannel(interaction.guild, tftMatch.players, channel);
            }
          }
          
          const thread = await interaction.message.startThread({
            name: `♟️ TFT Maç #${tftMatch.id}`,
            autoArchiveDuration: 60
          });
          tftMatch.threadId = thread.id;
          
          await thread.send(`♟️ **TFT maçı başlatıldı! (${tftMatch.players.length} oyuncu) Ses kanalınıza taşındınız!**`);
          await interaction.reply({ content: '✅ Maç başlatıldı!', ephemeral: true });
          Logger.success('TFT maçı zorla başlatıldı', { matchId: tftMatchId, playerCount: tftMatch.players.length });
        }
        return;
      }

      // LoL Buttons
      const matchId = await findMatchByMessage(interaction.message.id);
      if (!matchId) {
        return interaction.reply({ content: '❌ Maç bulunamadı!', ephemeral: true });
      }

      const match = await matchService.getLolMatch(matchId);
      if (!match) {
        return interaction.reply({ content: '❌ Maç bulunamadı!', ephemeral: true });
      }

      if (match.status !== 'waiting') {
        return interaction.reply({ content: '❌ Bu maç zaten başladı!', ephemeral: true });
      }

      // Ayrıl butonu
      if (interaction.customId === 'leave_match') {
        const removed = await matchService.removePlayerFromLolMatch(matchId, interaction.user.id);
        if (removed) {
          await updateMatchMessage(interaction, match);
          return interaction.reply({ content: '✅ Maçtan ayrıldınız!', ephemeral: true });
        }
        return interaction.reply({ content: '❌ Bu maçta değilsiniz!', ephemeral: true });
      }

      // Force start (LoL)
      if (interaction.customId === 'lol_force_start') {
        const isAdmin = interaction.memberPermissions?.has('Administrator');
        if (!isAdmin) {
          return interaction.reply({ content: '❌ Sadece adminler maçı başlatabilir!', ephemeral: true });
        }

        const blueCount = Object.keys(match.blueTeam).length;
        const redCount = Object.keys(match.redTeam).length;
        
        if (blueCount === 0 || redCount === 0) {
          return interaction.reply({ content: '❌ Her iki takımda da en az 1 oyuncu olmalı!', ephemeral: true });
        }

        // Uzun işlem için defer
        await interaction.deferReply({ ephemeral: true });

        match.status = 'active';
        
        // Kategori ve ses kanalları oluştur
        if (interaction.guild) {
          try {
            // Kategori oluştur
            const category = await interaction.guild.channels.create({
              name: `🎮 Maç #${match.id}`,
              type: 4 // Category
            });

            // Mavi takım ses kanalı (5 kişilik)
            const blueChannel = await interaction.guild.channels.create({
              name: '🔵 Mavi Takım',
              type: 2, // Voice
              parent: category,
              userLimit: 5,
              permissionOverwrites: [
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['Connect']
                },
                ...Object.values(match.blueTeam).map(playerId => ({
                  id: playerId,
                  allow: ['Connect', 'Speak']
                }))
              ]
            });

            // Kırmızı takım ses kanalı (5 kişilik)
            const redChannel = await interaction.guild.channels.create({
              name: '🔴 Kırmızı Takım',
              type: 2, // Voice
              parent: category,
              userLimit: 5,
              permissionOverwrites: [
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['Connect']
                },
                ...Object.values(match.redTeam).map(playerId => ({
                  id: playerId,
                  allow: ['Connect', 'Speak']
                }))
              ]
            });

            // Oyuncuları kanallarına taşı (ses kanalında olmayanlar için izin ver)
            for (const playerId of Object.values(match.blueTeam)) {
              try {
                const member = await interaction.guild.members.fetch(playerId);
                if (member.voice.channel) {
                  await member.voice.setChannel(blueChannel);
                  Logger.info('Oyuncu mavi takıma taşındı', { playerId, channelId: blueChannel.id });
                } else {
                  Logger.warn('Oyuncu ses kanalında değil', { playerId });
                }
              } catch (error) {
                Logger.error('Oyuncu taşınamadı', { playerId, error });
              }
            }

            for (const playerId of Object.values(match.redTeam)) {
              try {
                const member = await interaction.guild.members.fetch(playerId);
                if (member.voice.channel) {
                  await member.voice.setChannel(redChannel);
                  Logger.info('Oyuncu kırmızı takıma taşındı', { playerId, channelId: redChannel.id });
                } else {
                  Logger.warn('Oyuncu ses kanalında değil', { playerId });
                }
              } catch (error) {
                Logger.error('Oyuncu taşınamadı', { playerId, error });
              }
            }

            Logger.success('Ses kanalları oluşturuldu', { matchId, categoryId: category.id });
          } catch (error) {
            Logger.error('Ses kanalları oluşturulamadı', error);
          }
        }
        
        // Mesajı güncelle
        const startedEmbed = EmbedBuilder.createMatchStartedEmbed(match);
        const watchButtons = ComponentBuilder.createWatchButtons(match.id);
        
        await interaction.message.edit({
          embeds: [startedEmbed],
          components: watchButtons
        });
        
        const thread = await interaction.message.startThread({
          name: `🎮 Maç #${match.id}`,
          autoArchiveDuration: 60
        });
        match.threadId = thread.id;
        
        // Aktif oyunlar kanalına bildirim gönder
        const { configService } = await import('../services/configService');
        const gameChannelId = await configService.getGameChannel(interaction.guildId!, 'lol');
        if (gameChannelId && gameChannelId !== interaction.channelId) {
          const gameChannel = await interaction.client.channels.fetch(gameChannelId);
          if (gameChannel?.isTextBased()) {
            await gameChannel.send({
              embeds: [startedEmbed],
              components: watchButtons
            });
          }
        }
        
        await thread.send(`🎮 **Maç başlatıldı! (Mavi: ${blueCount}, Kırmızı: ${redCount})** Ses kanallarınız hazır! Ses kanalında değilseniz manuel olarak girin.`);
        await interaction.followUp({ content: '✅ Maç başlatıldı!', ephemeral: true });
        Logger.success('LoL maçı zorla başlatıldı', { matchId, blueCount, redCount });
        return;
      }

      // Takım katılma
      const [action, teamStr, roleStr] = interaction.customId.split('_');
      
      if (action === 'join') {
        const team = teamStr as Team;
        
        if (match.mode === LolMode.ARAM) {
          // Grup kontrolü
          const userGroup = await (await import('../services/groupService')).groupService.getUserGroup(interaction.user.id);
          
          if (userGroup) {
            // Grup olarak katıl
            const targetTeam = team === Team.BLUE ? match.blueTeam : match.redTeam;
            const availableSlots = 5 - Object.keys(targetTeam).length;
            
            if (userGroup.members.length > availableSlots) {
              return interaction.reply({ content: `❌ Bu takımda ${userGroup.members.length} kişilik grup için yeterli yer yok!`, ephemeral: true });
            }

            // Tüm grup üyelerini çıkart (başka takımdalarsa)
            for (const memberId of userGroup.members) {
              await matchService.removePlayerFromLolMatch(matchId, memberId);
            }

            // Tüm grup üyelerini ekle
            let slotIndex = 0;
            for (const memberId of userGroup.members) {
              while (slotIndex < 5) {
                const role = Object.values(LolRole)[slotIndex];
                if (!targetTeam[role]) {
                  targetTeam[role] = memberId;
                  slotIndex++;
                  break;
                }
                slotIndex++;
              }
            }

            await updateMatchMessage(interaction, match);
            return interaction.reply({ content: `✅ **${userGroup.name}** grubu takıma katıldı!`, ephemeral: true });
          } else {
            // Tekli katıl
            const targetTeam = team === Team.BLUE ? match.blueTeam : match.redTeam;
            const currentCount = Object.keys(targetTeam).length;
            
            if (currentCount >= 5) {
              return interaction.reply({ content: '❌ Bu takım dolu!', ephemeral: true });
            }

            await matchService.removePlayerFromLolMatch(matchId, interaction.user.id);
            
            for (let i = 0; i < 5; i++) {
              const role = Object.values(LolRole)[i];
              if (!targetTeam[role]) {
                targetTeam[role] = interaction.user.id;
                break;
              }
            }

            await updateMatchMessage(interaction, match);
            return interaction.reply({ content: '✅ Takıma katıldınız!', ephemeral: true });
          }
        } else {
          // Sihirdar Vadisi - grup kontrolü
          const userGroup = await (await import('../services/groupService')).groupService.getUserGroup(interaction.user.id);
          
          if (userGroup) {
            return interaction.reply({ content: '❌ Sihirdar Vadisi modunda grup ile katılamazsınız! Önce `/grup cik` yapın.', ephemeral: true });
          }
          
          // Sihirdar Vadisi için rol bazlı ekleme
          const role = roleStr as LolRole;
          
          // Oyuncu zaten başka yerde mi?
          await matchService.removePlayerFromLolMatch(matchId, interaction.user.id);
          
          const added = await matchService.addPlayerToLolMatch(matchId, team, role, interaction.user.id);
          if (!added) {
            return interaction.reply({ content: '❌ Bu pozisyon dolu!', ephemeral: true });
          }
          
          await updateMatchMessage(interaction, match);
          await interaction.reply({ content: '✅ Takıma katıldınız!', ephemeral: true });
        }

        // Maç dolu mu kontrol et
        if (await matchService.isLolMatchFull(matchId)) {
          await matchService.startLolMatch(matchId);
          
          // Kategori ve ses kanalları oluştur
          if (interaction.guild) {
            try {
              // Kategori oluştur
              const category = await interaction.guild.channels.create({
                name: `🎮 Maç #${match.id}`,
                type: 4 // Category
              });

              // Mavi takım ses kanalı (5 kişilik)
              const blueChannel = await interaction.guild.channels.create({
                name: '🔵 Mavi Takım',
                type: 2, // Voice
                parent: category,
                userLimit: 5,
                permissionOverwrites: [
                  {
                    id: interaction.guild.roles.everyone,
                    deny: ['Connect']
                  },
                  ...Object.values(match.blueTeam).map(playerId => ({
                    id: playerId,
                    allow: ['Connect', 'Speak']
                  }))
                ]
              });

              // Kırmızı takım ses kanalı (5 kişilik)
              const redChannel = await interaction.guild.channels.create({
                name: '🔴 Kırmızı Takım',
                type: 2, // Voice
                parent: category,
                userLimit: 5,
                permissionOverwrites: [
                  {
                    id: interaction.guild.roles.everyone,
                    deny: ['Connect']
                  },
                  ...Object.values(match.redTeam).map(playerId => ({
                    id: playerId,
                    allow: ['Connect', 'Speak']
                  }))
                ]
              });

              // Oyuncuları kanallarına taşı
              for (const playerId of Object.values(match.blueTeam)) {
                try {
                  const member = await interaction.guild.members.fetch(playerId);
                  if (member.voice.channel) {
                    await member.voice.setChannel(blueChannel);
                    Logger.info('Oyuncu mavi takıma taşındı', { playerId, channelId: blueChannel.id });
                  } else {
                    Logger.warn('Oyuncu ses kanalında değil', { playerId });
                  }
                } catch (error) {
                  Logger.error('Oyuncu taşınamadı', { playerId, error });
                }
              }

              for (const playerId of Object.values(match.redTeam)) {
                try {
                  const member = await interaction.guild.members.fetch(playerId);
                  if (member.voice.channel) {
                    await member.voice.setChannel(redChannel);
                    Logger.info('Oyuncu kırmızı takıma taşındı', { playerId, channelId: redChannel.id });
                  } else {
                    Logger.warn('Oyuncu ses kanalında değil', { playerId });
                  }
                } catch (error) {
                  Logger.error('Oyuncu taşınamadı', { playerId, error });
                }
              }

              Logger.success('Ses kanalları oluşturuldu', { matchId, categoryId: category.id });
            } catch (error) {
              Logger.error('Ses kanalları oluşturulamadı', error);
            }
          }
          
          // Thread oluştur
          const thread = await interaction.message.startThread({
            name: `🎮 Maç #${match.id}`,
            autoArchiveDuration: 60
          });
          match.threadId = thread.id;
          
          // Eski mesajı sil ve yeni "oyun başladı" mesajı at
          await interaction.message.delete();
          
          const startedEmbed = EmbedBuilder.createMatchStartedEmbed(match);
          const watchButtons = ComponentBuilder.createWatchButtons(match.id);
          
          const startedMessage = await interaction.channel!.send({
            embeds: [startedEmbed],
            components: watchButtons
          });
          
          match.messageId = startedMessage.id;
          
          // Aktif oyun kanalına bildirim gönder
          const { configService } = await import('../services/configService');
          const gameChannelId = await configService.getGameChannel(interaction.guildId!, 'lol');
          if (gameChannelId && gameChannelId !== interaction.channelId) {
            const gameChannel = await interaction.client.channels.fetch(gameChannelId);
            if (gameChannel?.isTextBased()) {
              await gameChannel.send({
                embeds: [startedEmbed],
                components: watchButtons
              });
            }
          }
          
          await thread.send('🎮 **Maç başladı!** Ses kanallarınız hazır! Ses kanalında değilseniz manuel olarak girin. İyi oyunlar!');
          Logger.success('Maç başladı ve ses kanalları oluşturuldu', { matchId, threadId: thread.id });
        } else {
          await updateMatchMessage(interaction, match);
        }
      }
    }
  },
};

async function findMatchByMessage(messageId: string): Promise<string | null> {
  const snapshot = await getDocs(collection(db, 'lol_matches'));
  for (const docSnap of snapshot.docs) {
    const match = docSnap.data();
    if (match.messageId === messageId) return docSnap.id;
  }
  return null;
}

async function findTftMatchByMessage(messageId: string): Promise<string | null> {
  const snapshot = await getDocs(collection(db, 'tft_matches'));
  for (const docSnap of snapshot.docs) {
    const match = docSnap.data();
    if (match.messageId === messageId) return docSnap.id;
  }
  return null;
}

async function updateMatchMessage(interaction: any, match: any) {
  const embed = EmbedBuilder.createLolMatchEmbed(match);
  const buttons = match.status === 'waiting' ? ComponentBuilder.createLolTeamButtons(match.mode) : [];
  
  await interaction.message.edit({
    embeds: [embed],
    components: buttons
  });
}

async function updateTftMatchMessage(interaction: any, match: any) {
  const embed = EmbedBuilder.createTftMatchEmbed(match);
  const buttons = match.status === 'waiting' ? ComponentBuilder.createTftButtons(match.mode === TftMode.DOUBLE ? 'double' : 'solo') : [];
  
  await interaction.message.edit({
    embeds: [embed],
    components: buttons
  });
}
