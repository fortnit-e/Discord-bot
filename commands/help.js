import { EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

export default {
  name: 'help',
  description: 'Shows all available commands',
  async execute(message, args) {
    try {
      const commands = message.client.commands;
      
      const categories = {
        MANAGEMENT: ['invite', 'restart'],
        LOBBY: ['lobby', 'close'],
        UTILITY: ['links', 'help']
      };

      const helpEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Command Categories');

      for (const [category, commands] of Object.entries(categories)) {
        helpEmbed.addFields({
          name: category,
          value: commands.map(cmd => `\`${message.client.prefix}${cmd}\``).join(', ')
        });
      }

      await message.reply({ embeds: [helpEmbed] });
      
    } catch (error) {
      await logError(message.client, error, {
        command: 'help',
        user: message.author.tag,
        channel: message.channel.name
      });
      await message.reply('❌ An error occurred while showing the help menu.');
    }
  },
}; 