import { EmbedBuilder } from 'discord.js';

export default {
    name: 'restart',
    description: 'Restarts the bot (Owner/Admin only)',
    async execute(message, args) {
        // Check if user is server owner or admin
        if (!message.member.permissions.has('Administrator') && message.author.id !== message.guild.ownerId) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Permission Denied')
                .setDescription('Only server administrators or the owner can restart the bot.');
            
            const reply = await message.channel.send({ embeds: [embed] });
            setTimeout(() => reply.delete().catch(() => {}), 5000);
            return;
        }

        try {
            // Send confirmation message
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('🔄 Restarting Bot')
                .setDescription('Bot is restarting...')
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            const statusMessage = await message.channel.send({ embeds: [embed] });

            // Store message info for updating after restart
            process.env.RESTART_CHANNEL = message.channel.id;
            process.env.RESTART_MESSAGE = statusMessage.id;

            // Log the restart attempt
            console.log(`Bot restart initiated by ${message.author.tag}`);

            // Exit process - Railway will automatically restart it
            process.exit(0);

        } catch (error) {
            console.error('Error in restart command:', error);
            await message.reply('❌ An error occurred while trying to restart the bot.');
        }
    },
}; 