import { EmbedBuilder } from 'discord.js';

export default {
  name: 'help',
  description: 'Shows all available commands',
  async execute(message, args) {
    try {
      const commands = message.client.commands;
      
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📚 Available Commands')
        .setDescription('Here are all the available commands:')
        .addFields([
          {
            name: '!lobby <number>',
            value: 'Creates a new lobby category with code, chat, and fills channels',
            inline: false
          },
          {
            name: '!close',
            value: 'Closes a lobby by removing all its channels (must be used in a lobby channel)',
            inline: false
          },
          {
            name: '!invite <role>',
            value: 'Generates a single-use invite link and sends it to all users with the specified role',
            inline: false
          },
          {
            name: '!links <user>',
            value: 'Checks if a user has linked their Epic Games account (mention user or use ID)',
            inline: false
          },
          {
            name: '!help',
            value: 'Shows this help message',
            inline: false
          }
        ])
        .setFooter({ 
          text: `Requested by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error in help command:', error);
      await message.reply('❌ An error occurred while showing the help menu.');
    }
  },
}; 