import { EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

export default {
    name: 'reactions',
    description: 'Shows reaction statistics for the latest message in a channel',
    async execute(message, args) {
        try {
            // Get target channel
            const targetChannel = message.mentions.channels.first() || message.channel;

            // Fetch last 50 messages and find the first one with reactions
            const messages = await targetChannel.messages.fetch({ limit: 50 });
            const messageWithReactions = messages.find(msg => msg.reactions.cache.size > 0);

            if (!messageWithReactions) {
                return message.reply('❌ No messages with reactions found in the last 50 messages.');
            }

            // Debug logging
            console.log('Found message with reactions:', {
                id: messageWithReactions.id,
                content: messageWithReactions.content.slice(0, 50),
                reactionCount: messageWithReactions.reactions.cache.size,
                reactions: Array.from(messageWithReactions.reactions.cache.values()).map(r => ({
                    emoji: r.emoji.toString(),
                    count: r.count
                }))
            });

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Reaction Statistics')
                .setDescription(
                    `Message reactions in ${targetChannel}\n` +
                    `Message Preview: \`${messageWithReactions.content.slice(0, 100)}${messageWithReactions.content.length > 100 ? '...' : ''}\``
                )
                .addFields(
                    { 
                        name: 'Message Link', 
                        value: `[Jump to Message](${messageWithReactions.url})`,
                        inline: false 
                    }
                );

            // Get reaction counts
            for (const reaction of messageWithReactions.reactions.cache.values()) {
                try {
                    // Fetch users who reacted
                    const users = await reaction.users.fetch();
                    const userList = users.map(user => user.tag).join('\n');
                    
                    embed.addFields({
                        name: `${reaction.emoji.toString()} (${reaction.count})`,
                        value: userList || 'No users found',
                        inline: true
                    });
                } catch (error) {
                    console.error(`Error fetching users for reaction ${reaction.emoji}:`, error);
                    embed.addFields({
                        name: `${reaction.emoji.toString()} (${reaction.count})`,
                        value: 'Unable to fetch users',
                        inline: true
                    });
                }
            }

            // Add timestamp and message info
            embed.setFooter({ 
                text: `Message sent at ${messageWithReactions.createdAt.toLocaleString()}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Full error:', error); // Additional debug logging
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