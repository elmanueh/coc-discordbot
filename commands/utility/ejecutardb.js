import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import * as Controller from '../../src/controller.js';
import * as ControllerStatus from '../../src/controller-status.js';
import localeJSON from '../../src/locale.json' assert { type: 'json' };

const ELMANUEH_DISCORD_ID = '219739628196855808';

export default {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('ejecutardb')
    .setDescription('Realiza acciones en la base de datos. (Ten cuidado con lo que ejecutas)')
    .addStringOption((option) => option.setName('ejecutar').setDescription('Ejecucion en formato SQL.').setRequired(true)),
  async execute(interaction) {
    try {
      const queryDatabase = interaction.options.getString('ejecutar');
      if (interaction.user.id !== ELMANUEH_DISCORD_ID) return interaction.reply({ content: localeJSON.discord_permission_insufficient, ephemeral: true });

      const commitButton = new ButtonBuilder().setCustomId('commit').setLabel('Commit').setStyle(ButtonStyle.Success);
      const rollbackButton = new ButtonBuilder().setCustomId('rollback').setLabel('Rollback').setStyle(ButtonStyle.Danger);
      const rowButtons = new ActionRowBuilder().addComponents(commitButton, rollbackButton);

      await interaction.deferReply({ ephemeral: true });
      const response = await Controller.executeDB(queryDatabase);
      switch (response[0]) {
        case ControllerStatus.EXECUTE_DB_FAIL:
          throw -1;
        case ControllerStatus.EXECUTE_DB_OK:
          const messageInteraction = await interaction.editReply({ content: localeJSON.database_confirmation, components: [rowButtons], ephemeral: true });
          try {
            const buttonPressed = await messageInteraction.awaitMessageComponent({ time: 30_000 });
            if (buttonPressed.customId === 'commit') {
              await Controller.executeDBOk(response[1]);
              await buttonPressed.update({ content: localeJSON.database_confirmation_ok, components: [], ephemeral: true });
            } else if (buttonPressed.customId === 'rollback') {
              await Controller.executeDBCancel(response[1]);
              await buttonPressed.update({ content: localeJSON.database_confirmation_fail, components: [], ephemeral: true });
            }
          } catch (error) {
            await Controller.executeDBCancel(response[1]);
            await interaction.editReply({ content: localeJSON.database_confirmation_fail, components: [] });
          }
      }
    } catch (error) {
      await interaction.editReply({ content: localeJSON.error_notify_in_discord, ephemeral: true });
    }
  }
};
