import { ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

export default {
  name: 'close',
  description: 'Close a lobby by removing its channels and category',
  async execute(message, args) {
    try {
      // Check if the message is in a lobby channel
      const channel = message.channel;
      if (!channel.parent || !channel.parent.name.toLowerCase().startsWith('lobby')) {
        return message.reply('This command can only be used in a lobby channel.');
      }

      const category = channel.parent;
      const lobbyNumber = category.name.split(' ')[1]; // Gets the number from "Lobby X"

      // Create confirmation embed
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('⚠️ Close Lobby')
        .setDescription(`Are you sure you want to close Lobby ${lobbyNumber}?\nThis will delete all channels in this category.`)
        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

      // Create buttons
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_close')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_close')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton);

      // Send message with buttons
      const confirmationMessage = await message.reply({
        embeds: [embed],
        components: [row]
      });

      // Create button collector
      const collector = confirmationMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000 // 30 seconds timeout
      });

      collector.on('collect', async (interaction) => {
        // Check if the person who clicked is the same as who initiated
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: 'Only the person who initiated the close command can use these buttons.',
            ephemeral: true
          });
        }

        if (interaction.customId === 'confirm_close') {
          // Disable the buttons
          row.components.forEach(button => button.setDisabled(true));
          await interaction.update({ components: [row] });

          // Delete all channels in the category
          const deletionEmbed = new EmbedBuilder()
            .setColor('Yellow')
            .setDescription('🔄 Closing lobby, deleting channels...');
          
          await interaction.message.edit({ embeds: [deletionEmbed], components: [] });

          try {
            // Log the deletion before actually deleting
            const logChannel = await message.client.channels.fetch('1325177916421570682');
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🗑️ Lobby Closed')
                    .setDescription(`Lobby ${lobbyNumber} has been closed`)
                    .addFields(
                        { name: 'Closed By', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
                        { name: 'Category ID', value: category.id, inline: true }
                    )
                    .setFooter({ text: `Lobby #${lobbyNumber}` })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

            // Delete all channels in the category
            const promises = category.children.cache.map(channel => channel.delete());
            await Promise.all(promises);
            
            // Finally delete the category
            await category.delete();

            // Send success message in the channel where command was used (if it still exists)
            try {
              await message.channel.send(`✅ Lobby ${lobbyNumber} has been successfully closed.`);
            } catch (e) {
              // Channel was already deleted, try to send in any available channel
              const generalChannel = message.guild.channels.cache
                .find(ch => ch.type === 0 && ch.permissionsFor(message.guild.members.me).has('SendMessages'));
              if (generalChannel) {
                await generalChannel.send(`✅ Lobby ${lobbyNumber} has been successfully closed.`);
              }
            }
          } catch (error) {
            console.error('Error while deleting channels:', error);
            await interaction.message.edit({
              embeds: [new EmbedBuilder()
                .setColor('Red')
                .setDescription('❌ An error occurred while closing the lobby.')],
              components: []
            });
          }
        } else if (interaction.customId === 'cancel_close') {
          // Update message to show cancelled
          const cancelEmbed = new EmbedBuilder()
            .setColor('Green')
            .setDescription('✅ Lobby closure cancelled.');
          
          await interaction.update({
            embeds: [cancelEmbed],
            components: [] // Remove buttons
          });
        }

        // Stop collecting
        collector.stop();
      });

      // Handle collector end
      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          const timeoutEmbed = new EmbedBuilder()
            .setColor('Grey')
            .setDescription('❌ Close command timed out. Please try again.');
          
          confirmationMessage.edit({
            embeds: [timeoutEmbed],
            components: [] // Remove buttons
          });
        }
      });

    } catch (error) {
      await logError(message.client, error, {
        command: 'close',
        user: message.author.tag,
        channel: message.channel.name
      });
      await message.reply('❌ An error occurred while trying to close the lobby.');
    }
  },
}; 