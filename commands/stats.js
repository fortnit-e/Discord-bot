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
            console.error('Error in stats command:', error);
            await message.reply('❌ Could not fetch user stats.');
        }
    }
}; 