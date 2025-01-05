import { EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

export default {
    name: 'reactions',
    description: 'Shows reaction statistics for the latest message in a channel',
    async execute(message, args) {
        try {
            // Get target channel
            const targetChannel = message.mentions.channels.first() || message.channel;

            // Fetch latest messages with force cache refresh
            const messages = await targetChannel.messages.fetch({ 
                limit: 10,  // Fetch more messages to ensure we get the latest
                cache: false // Force fresh fetch
            });

            // Sort messages by timestamp and get the latest
            const latestMessage = messages.sort((a, b) => b.createdTimestamp - a.createdTimestamp).first();

            if (!latestMessage) {
                return message.reply('❌ No messages found in the specified channel.');
            }

            // Force fetch the message to ensure reactions are up to date
            const fetchedMessage = await targetChannel.messages.fetch(latestMessage.id);
            
            // Debug logging
            console.log('Latest message:', {
                id: fetchedMessage.id,
                content: fetchedMessage.content.slice(0, 50), // First 50 chars
                reactionCount: fetchedMessage.reactions.cache.size,
                reactions: Array.from(fetchedMessage.reactions.cache.values()).map(r => ({
                    emoji: r.emoji.toString(),
                    count: r.count
                }))
            });

            if (fetchedMessage.reactions.cache.size === 0) {
                return message.reply('❌ No reactions found on the latest message.');
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Reaction Statistics')
                .setDescription(
                    `Latest message reactions in ${targetChannel}\n` +
                    `Message Preview: \`${fetchedMessage.content.slice(0, 100)}${fetchedMessage.content.length > 100 ? '...' : ''}\``
                )
                .addFields(
                    { 
                        name: 'Message Link', 
                        value: `[Jump to Message](${fetchedMessage.url})`,
                        inline: false 
                    }
                );

            // Get reaction counts
            const reactionStats = [];
            for (const reaction of fetchedMessage.reactions.cache.values()) {
                try {
                    // Fetch users who reacted
                    const users = await reaction.users.fetch();
                    reactionStats.push({
                        emoji: reaction.emoji.toString(),
                        count: reaction.count,
                        users: users.map(user => user.tag)
                    });
                } catch (error) {
                    console.error(`Error fetching users for reaction ${reaction.emoji}:`, error);
                    reactionStats.push({
                        emoji: reaction.emoji.toString(),
                        count: reaction.count,
                        users: ['Unable to fetch users']
                    });
                }
            }

            // Add reaction statistics to embed
            reactionStats.forEach(stat => {
                embed.addFields({
                    name: `${stat.emoji} (${stat.count})`,
                    value: stat.users.join('\n') || 'No users found',
                    inline: true
                });
            });

            // Add timestamp and message info
            embed.setFooter({ 
                text: `Message sent at ${fetchedMessage.createdAt.toLocaleString()}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

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