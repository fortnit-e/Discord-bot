import { EmbedBuilder } from 'discord.js';

export default {
  name: 'start',
  description: 'Start a match with a specified number of players',
  async execute(message, args) {
    if (!args[0] || isNaN(args[0])) {
      return message.reply('Please provide a valid number of players.');
    }

    const playerCount = parseInt(args[0]);

    // Create an embed message using EmbedBuilder
    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('Match Started')
      .setDescription(` **Match started at ${playerCount} players.** `)
      .setTimestamp()
      .setFooter({ text: 'Match Info' });

    // Send the embed message
    await message.channel.send({ embeds: [embed] });
  },
};
