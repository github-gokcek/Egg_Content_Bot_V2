import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { LolMode, LolRole, Team } from '../types';

export class ComponentBuilder {
  static createGameModeSelect(): ActionRowBuilder<StringSelectMenuBuilder> {
    const select = new StringSelectMenuBuilder()
      .setCustomId('select_game_mode')
      .setPlaceholder('Oyun modu seçin')
      .addOptions([
        {
          label: 'LoL - Sihirdar Vadisi',
          description: '5v5 Klasik mod',
          value: 'lol_summoners_rift',
          emoji: '⚔️'
        },
        {
          label: 'LoL - ARAM',
          description: '5v5 Tek koridor',
          value: 'lol_aram',
          emoji: '🎲'
        },
        {
          label: 'TFT - Solo',
          description: '8 kişilik solo oyun',
          value: 'tft_solo',
          emoji: '♟️'
        },
        {
          label: 'TFT - Double Up',
          description: '4 takım 2\'şer kişi',
          value: 'tft_double',
          emoji: '👥'
        }
      ]);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
  }

  static createLolTeamButtons(mode: LolMode): ActionRowBuilder<ButtonBuilder>[] {
    if (mode === LolMode.ARAM) {
      return [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('join_blue')
            .setLabel('Mavi Takım')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔵'),
          new ButtonBuilder()
            .setCustomId('join_red')
            .setLabel('Kırmızı Takım')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔴'),
          new ButtonBuilder()
            .setCustomId('leave_match')
            .setLabel('Ayrıl')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌'),
          new ButtonBuilder()
            .setCustomId('lol_force_start')
            .setLabel('Maçı Başlat (Admin)')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚡')
        )
      ];
    }

    // Sihirdar Vadisi - Mavi Takım
    const blueRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`join_blue_${LolRole.TOP}`)
        .setLabel('Üst')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⬆️'),
      new ButtonBuilder()
        .setCustomId(`join_blue_${LolRole.JUNGLE}`)
        .setLabel('Orman')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🌲'),
      new ButtonBuilder()
        .setCustomId(`join_blue_${LolRole.MID}`)
        .setLabel('Orta')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⭐'),
      new ButtonBuilder()
        .setCustomId(`join_blue_${LolRole.ADC}`)
        .setLabel('ADC')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎯'),
      new ButtonBuilder()
        .setCustomId(`join_blue_${LolRole.SUPPORT}`)
        .setLabel('Destek')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🛡️')
    );

    // Kırmızı Takım
    const redRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`join_red_${LolRole.TOP}`)
        .setLabel('Üst')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⬆️'),
      new ButtonBuilder()
        .setCustomId(`join_red_${LolRole.JUNGLE}`)
        .setLabel('Orman')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🌲'),
      new ButtonBuilder()
        .setCustomId(`join_red_${LolRole.MID}`)
        .setLabel('Orta')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⭐'),
      new ButtonBuilder()
        .setCustomId(`join_red_${LolRole.ADC}`)
        .setLabel('ADC')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🎯'),
      new ButtonBuilder()
        .setCustomId(`join_red_${LolRole.SUPPORT}`)
        .setLabel('Destek')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛡️')
    );

    // Ayrıl butonu
    const leaveRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('leave_match')
        .setLabel('Maçtan Ayrıl')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌'),
      new ButtonBuilder()
        .setCustomId('lol_force_start')
        .setLabel('Maçı Başlat (Admin)')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⚡')
    );

    return [blueRow, redRow, leaveRow];
  }

  static createTftButtons(mode?: string): ActionRowBuilder<ButtonBuilder>[] {
    if (mode === 'double') {
      // Double Up - Takım butonları
      return [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('tft_join_team1')
            .setLabel('1. Takım')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🥇'),
          new ButtonBuilder()
            .setCustomId('tft_join_team2')
            .setLabel('2. Takım')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🥈'),
          new ButtonBuilder()
            .setCustomId('tft_join_team3')
            .setLabel('3. Takım')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🥉'),
          new ButtonBuilder()
            .setCustomId('tft_join_team4')
            .setLabel('4. Takım')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏅')
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('tft_leave')
            .setLabel('Ayrıl')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌'),
          new ButtonBuilder()
            .setCustomId('tft_force_start')
            .setLabel('Maçı Başlat (Admin)')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚡')
        )
      ];
    }
    
    // Solo
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('tft_join')
          .setLabel('Oyuna Katıl')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎮'),
        new ButtonBuilder()
          .setCustomId('tft_join_reserve')
          .setLabel('Yedek Olarak Katıl')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔄'),
        new ButtonBuilder()
          .setCustomId('tft_leave')
          .setLabel('Ayrıl')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌'),
        new ButtonBuilder()
          .setCustomId('tft_force_start')
          .setLabel('Maçı Başlat (Admin)')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⚡')
      )
    ];
  }

  static createWatchButtons(matchId: string): ActionRowBuilder<ButtonBuilder>[] {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`watch_blue_${matchId}`)
          .setLabel('Mavi Takımı İzle')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔵'),
        new ButtonBuilder()
          .setCustomId(`watch_red_${matchId}`)
          .setLabel('Kırmızı Takımı İzle')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔴')
      )
    ];
  }
}
