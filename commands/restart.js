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
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('🔄 Bot Restart Sequence')
                .setDescription(
                    '**Current Status:**\n' +
                    '• Initiating restart sequence...\n' +
                    '• Preparing for shutdown...\n\n' +
                    '**Please Wait:**\n' +
                    '• Bot will restart automatically\n' +
                    '• This may take up to 60 seconds'
                )
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            const statusMessage = await message.channel.send({ embeds: [embed] });

            // Store message info for after restart
            process.env.RESTART_CHANNEL = message.channel.id;
            process.env.RESTART_MESSAGE = statusMessage.id;
            process.env.RESTART_TIME = Date.now().toString();
            process.env.RESTART_REQUESTER = message.author.tag;

            // Update status before shutdown
            const updatedEmbed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('🔄 Bot Shutting Down')
                .setDescription(
                    '**Status Update:**\n' +
                    '• Closing connections...\n' +
                    '• Bot will restart shortly...\n\n' +
                    '**Please Note:**\n' +
                    '• Bot will be offline briefly\n' +
                    '• Status will update when back online'
                )
                .setTimestamp();

            await statusMessage.edit({ embeds: [updatedEmbed] });
            
            // Log the restart
            console.log(`Bot restart initiated by ${message.author.tag} at ${new Date().toISOString()}`);

            // Properly destroy the client connection
            await message.client.destroy();
            
            // Exit with error code to trigger Railway restart
            process.exit(1);

        } catch (error) {
            console.error('Error in restart command:', error);
            await message.reply('❌ An error occurred while trying to restart the bot.');
        }
    },
}; 