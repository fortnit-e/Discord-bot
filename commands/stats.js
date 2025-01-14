import { EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

export default {
    name: 'stats',
    description: 'Show user statistics',
    async execute(message, args) {
        const userId = args[0]?.replace(/[<@!>]/g, '') || message.author.id;
        try {
            const user = await message.client.users.fetch(userId);
            const member = await message.guild.members.fetch(userId);
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Stats for ${user.tag}`)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'Joined Server', value: member.joinedAt.toLocaleDateString() },
                    { name: 'Account Created', value: user.createdAt.toLocaleDateString() },
                    { name: 'Roles', value: member.roles.cache.size.toString() }
                );

            await message.reply({ embeds: [embed] });
        } catch (error) {
            await logError(message.client, error, {
                command: 'stats',
                user: message.author.tag,
                channel: message.channel.name,
                target: args[0] || 'self'
            });
            await message.reply('❌ Could not fetch user stats.');
        }
    }
}; 