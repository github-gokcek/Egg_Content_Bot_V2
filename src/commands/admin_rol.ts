import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { roleService } from '../services/roleService';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adminrol')
    .setDescription('Admin komutları')
    .addSubcommandGroup(group =>
      group.setName('rol')
        .setDescription('Rol yönetimi')
        .addSubcommand(sub =>
          sub.setName('ekle')
            .setDescription('Rol seçim menüsüne rol ekle')
            .addRoleOption(opt =>
              opt.setName('rol')
                .setDescription('Eklenecek rol')
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('cikar')
            .setDescription('Rol seçim menüsünden rol çıkar')
            .addRoleOption(opt =>
              opt.setName('rol')
                .setDescription('Çıkarılacak rol')
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('liste')
            .setDescription('Rol seçim menüsündeki rolleri listele')
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('Administrator')) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için yönetici olmalısınız!', ephemeral: true });
    }

    if (!interaction.guildId || !interaction.guild) {
      return interaction.reply({ content: '❌ Bu komut sadece sunucularda kullanılabilir!', ephemeral: true });
    }

    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (group === 'rol') {
      if (subcommand === 'ekle') {
        const role = interaction.options.getRole('rol', true);

        if (role.managed) {
          return interaction.reply({ 
            content: '❌ Bot rolleri veya entegrasyon rolleri eklenemez!', 
            ephemeral: true 
          });
        }

        const success = await roleService.addRole(interaction.guildId, role.id);

        if (success) {
          await interaction.reply({ 
            content: `✅ **${role.name}** rolü seçim menüsüne eklendi!`, 
            ephemeral: true 
          });
        } else {
          await interaction.reply({ 
            content: '❌ Rol eklenirken hata oluştu!', 
            ephemeral: true 
          });
        }
      }

      else if (subcommand === 'cikar') {
        const role = interaction.options.getRole('rol', true);

        const success = await roleService.removeRole(interaction.guildId, role.id);

        if (success) {
          await interaction.reply({ 
            content: `✅ **${role.name}** rolü seçim menüsünden çıkarıldı!`, 
            ephemeral: true 
          });
        } else {
          await interaction.reply({ 
            content: '❌ Rol çıkarılırken hata oluştu!', 
            ephemeral: true 
          });
        }
      }

      else if (subcommand === 'liste') {
        const roles = await roleService.getRoles(interaction.guildId);

        if (roles.length === 0) {
          return interaction.reply({ 
            content: '📋 Henüz rol eklenmemiş!', 
            ephemeral: true 
          });
        }

        const roleNames: string[] = [];
        for (const roleId of roles) {
          const role = await interaction.guild.roles.fetch(roleId);
          if (role) {
            roleNames.push(`• ${role.name} (${role.id})`);
          }
        }

        await interaction.reply({ 
          content: `📋 **Rol Seçim Menüsündeki Roller:**\n\n${roleNames.join('\n')}`, 
          ephemeral: true 
        });
      }
    }
  },
};
