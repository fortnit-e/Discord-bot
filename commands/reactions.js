import { EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

export default {
    name: 'reactions',
    description: 'Shows reaction statistics for the latest message in a channel',
    async execute(message, args) {
        try {
            // Get target channel
            const targetChannel = message.mentions.channels.first() || message.channel;

            // Fetch latest messages
            const messages = await targetChannel.messages.fetch({ limit: 1 });
            const latestMessage = messages.first();

            if (!latestMessage) {
                return message.reply('❌ No messages found in the specified channel.');
            }

            if (latestMessage.reactions.cache.size === 0) {
                return message.reply('❌ No reactions found on the latest message.');
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Reaction Statistics')
                .setDescription(`Latest message reactions in ${targetChannel}`)
                .addFields(
                    { 
                        name: 'Message Link', 
                        value: `[Jump to Message](${latestMessage.url})`,
                        inline: false 
                    }
                );

            // Get reaction counts
            const reactionStats = [];
            for (const reaction of latestMessage.reactions.cache.values()) {
                // Fetch users who reacted
                const users = await reaction.users.fetch();
                reactionStats.push({
                    emoji: reaction.emoji.toString(),
                    count: reaction.count,
                    users: users.map(user => user.tag)
                });
            }

            // Add reaction statistics to embed
            reactionStats.forEach(stat => {
                embed.addFields({
                    name: `${stat.emoji} (${stat.count})`,
                    value: stat.users.join('\n') || 'No users found',
                    inline: true
                });
            });

            // Add timestamp
            embed.setFooter({ 
                text: `Message sent at ${latestMessage.createdAt.toLocaleString()}`,
                iconURL: message.author.displayAvatarURL()
            });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            await logError(message.client, error, {
                command: 'reactions',
                user: message.author.tag,
                channel: message.channel.name,
                targetChannel: args[0] || 'current'
            });
            await message.reply('❌ An error occurred while fetching reaction statistics.');
        }
    },
}; 