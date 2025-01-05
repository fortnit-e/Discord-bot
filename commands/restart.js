import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logError } from '../utils/errorLogger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESTART_FILE = path.join(__dirname, '..', 'restart-info.json');

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
            // Create confirmation buttons
            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm_restart')
                .setLabel('Confirm Restart')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔄');

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel_restart')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('✖️');

            const row = new ActionRowBuilder()
                .addComponents(confirmButton, cancelButton);

            // Send confirmation message with buttons
            const initialEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('⚠️ Confirm Bot Restart')
                .setDescription(
                    '**Are you sure you want to restart the bot?**\n\n' +
                    '**Note:**\n' +
                    '• Bot will be offline briefly\n' +
                    '• All commands will be unavailable during restart\n' +
                    '• Restart process takes about 30-60 seconds\n\n' +
                    '**Time Remaining:**\n' +
                    '• 30 seconds'
                )
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            const confirmationMessage = await message.reply({
                embeds: [initialEmbed],
                components: [row]
            });

            // Create button collector
            const collector = confirmationMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 30000
            });

            // Start countdown
            let timeLeft = 30;
            const countdown = setInterval(async () => {
                timeLeft -= 5;
                if (timeLeft > 0) {
                    const updatedEmbed = new EmbedBuilder()
                        .setColor('Yellow')
                        .setTitle('⚠️ Confirm Bot Restart')
                        .setDescription(
                            '**Are you sure you want to restart the bot?**\n\n' +
                            '**Note:**\n' +
                            '• Bot will be offline briefly\n' +
                            '• All commands will be unavailable during restart\n' +
                            '• Restart process takes about 30-60 seconds\n\n' +
                            '**Time Remaining:**\n' +
                            `• ${timeLeft} seconds`
                        )
                        .setFooter({ 
                            text: `Requested by ${message.author.tag}`,
                            iconURL: message.author.displayAvatarURL()
                        })
                        .setTimestamp();

                    await confirmationMessage.edit({ embeds: [updatedEmbed] });
                }
            }, 5000); // Update every 5 seconds

            collector.on('collect', async (interaction) => {
                // Clear the countdown interval when a button is clicked
                clearInterval(countdown);

                // Check if the person who clicked is the same as who initiated
                if (interaction.user.id !== message.author.id) {
                    await interaction.reply({
                        content: 'Only the person who initiated the restart can use these buttons.',
                        ephemeral: true
                    });
                    return;
                }

                // Disable buttons
                row.components.forEach(button => button.setDisabled(true));
                await interaction.update({ components: [row] });

                if (interaction.customId === 'confirm_restart') {
                    const restartEmbed = new EmbedBuilder()
                        .setColor('Orange')
                        .setTitle('🔄 Bot Restart Sequence')
                        .setDescription(
                            '**Current Status:**\n' +
                            '• Initiating restart sequence...\n' +
                            '• Preparing for shutdown...\n\n' +
                            '**Please Wait:**\n' +
                            '• Bot will restart automatically\n' +
                            '• This may take up to 60 seconds'
                        )
                        .setTimestamp();

                    await interaction.message.edit({ embeds: [restartEmbed] });

                    // Store restart info
                    const restartInfo = {
                        channelId: message.channel.id,
                        messageId: interaction.message.id,
                        time: Date.now(),
                        requester: message.author.tag
                    };

                    await fs.writeFile(RESTART_FILE, JSON.stringify(restartInfo, null, 2));

                    // Final update before shutdown
                    const shutdownEmbed = new EmbedBuilder()
                        .setColor('Red')
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

                    await interaction.message.edit({ embeds: [shutdownEmbed] });
                    
                    // Log the restart
                    console.log(`Bot restart initiated by ${message.author.tag} at ${new Date().toISOString()}`);

                    // Destroy client and exit
                    await message.client.destroy();
                    process.exit(1);

                } else if (interaction.customId === 'cancel_restart') {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('✅ Restart Cancelled')
                        .setDescription('The bot restart has been cancelled.')
                        .setTimestamp();

                    await interaction.message.edit({ embeds: [cancelEmbed] });
                }
            });

            // Handle collector end (timeout)
            collector.on('end', async (collected, reason) => {
                // Clear the countdown interval when collector ends
                clearInterval(countdown);

                if (reason === 'time') {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('Grey')
                        .setTitle('⏰ Restart Cancelled')
                        .setDescription('Restart confirmation timed out.')
                        .setTimestamp();

                    row.components.forEach(button => button.setDisabled(true));
                    await confirmationMessage.edit({
                        embeds: [timeoutEmbed],
                        components: [row]
                    });
                }
            });

        } catch (error) {
            await logError(message.client, error, {
                command: 'restart',
                user: message.author.tag,
                channel: message.channel.name
            });
            await message.reply('❌ An error occurred while trying to restart the bot.');
        }
    },
}; 