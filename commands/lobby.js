import { ChannelType, PermissionsBitField, EmbedBuilder } from 'discord.js';

export default {
  name: 'lobby',
  description: 'Create a lobby category and channels for a given lobby number',
  async execute(message, args) {
    if (!args[0]) {
      return message.reply('Please specify a lobby number.');
    }

    const lobbyNumber = args[0];

    try {
      console.log('Lobby Number:', lobbyNumber);

      // Create category for lobby
      const categoryName = `Lobby ${lobbyNumber}`;
      console.log('Creating category with name:', categoryName);

      const category = await message.guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        reason: 'Lobby setup requested by user'
      });

      console.log('Category created:', category.id);

      // Create lobby code channel
      console.log(`Creating code channel under category ${categoryName}`);
      await message.guild.channels.create({
        name: `lobby-${lobbyNumber}-code`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: message.guild.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ],
        reason: 'Lobby code channel'
      });

      // Create lobby chat channel
      console.log(`Creating chat channel under category ${categoryName}`);
      await message.guild.channels.create({
        name: `lobby-${lobbyNumber}-chat`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: message.guild.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ],
        reason: 'Lobby chat channel'
      });

      // Create lobby fills channel
      console.log(`Creating fills channel under category ${categoryName}`);
      await message.guild.channels.create({
        name: `lobby-${lobbyNumber}-fills`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: message.guild.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ],
        reason: 'Lobby fills channel'
      });

      console.log('Lobby channels created successfully.');
      await message.reply(`Lobby setup complete! Category and channels for Lobby ${lobbyNumber} created.`);

      // Add logging
      const logChannel = await message.client.channels.fetch('1325177916421570682');
      if (logChannel) {
          const logEmbed = new EmbedBuilder()
              .setColor('#00ff00')
              .setTitle('🎮 Lobby Created')
              .setDescription(`Lobby ${lobbyNumber} has been created`)
              .addFields(
                  { name: 'Created By', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
                  { name: 'Category ID', value: category.id, inline: true }
              )
              .setFooter({ text: `Lobby #${lobbyNumber}` })
              .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
      }

      // Set cooldown after successful creation
      const cooldownTime = 30000; // 30 seconds
      message.client.cooldowns.setCooldown(message.author.id, 'lobby', cooldownTime);

    } catch (error) {
      console.error('Error creating lobby channels:', error);
      await message.reply('There was an error setting up the lobby. Please try again.');
    }
  },
};