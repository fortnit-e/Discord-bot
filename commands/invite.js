import { PermissionsBitField, EmbedBuilder, ChannelType } from 'discord.js';

const cooldowns = new Map();

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

async function logInviteAction(client, {
    type,
    user,
    guild,
    target = null,
    inviteCount = null,
    success = true,
    error = null
}) {
    try {
        const logChannel = await client.channels.fetch('1325221526362132571');
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor(success ? '#00ff00' : '#ff0000')
            .setTitle(`🎫 Invite ${type}`)
            .addFields(
                { name: 'Invoked By', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Server', value: guild.name, inline: true },
                { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setTimestamp();

        if (target) {
            embed.addFields({ 
                name: 'Target', 
                value: typeof target === 'string' ? target : `${target.tag} (${target.id})`,
                inline: true 
            });
        }

        if (inviteCount !== null) {
            embed.addFields({ 
                name: 'Invite Count', 
                value: `${inviteCount}`, 
                inline: true 
            });
        }

        if (error) {
            embed.addFields({ 
                name: 'Error', 
                value: `\`\`\`${error}\`\`\``, 
                inline: false 
            });
        }

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging invite action:', error);
    }
}

async function updateInviteDM(client, invite) {
    try {
        // Get all users who have DM channels with the bot
        const users = await client.users.cache;
        
        for (const [userId, user] of users) {
            try {
                // Try to create/get DM channel
                const dmChannel = await user.createDM();
                
                // Fetch recent messages in the DM
                const messages = await dmChannel.messages.fetch({ limit: 100 });
                
                // Find message containing this invite URL
                const inviteMessage = messages.find(msg => 
                    msg.author.id === client.user.id && 
                    msg.embeds.length > 0 && 
                    msg.embeds[0].fields?.some(field => field.name === 'Invite Link' && field.value === invite.url)
                );

                if (inviteMessage) {
                    console.log(`Found invite message in DM with ${user.tag}`);
                    
                    const retractEmbed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('⚠️ Invite Retracted')
                        .setDescription('This invite link has been retracted and is no longer valid.')
                        .addFields({
                            name: 'Original Invite',
                            value: `~~${invite.url}~~`
                        })
                        .setTimestamp();

                    await inviteMessage.edit({
                        content: '```diff\n- ⚠️ This invite link has been retracted and can no longer be used. Please contact a server admin.\n```',
                        embeds: [retractEmbed]
                    });
                    
                    console.log(`Successfully updated invite message in DM with ${user.tag}`);
                    return true; // Successfully found and updated the message
                }
            } catch (error) {
                console.error(`Error checking DM channel for user ${user.tag}:`, error);
                continue;
            }
        }
        console.log('Could not find original invite message in any DM channel');
        return false;
    } catch (error) {
        console.error('Error in updateInviteDM:', error);
        return false;
    }
}

async function cleanupMessages(message, response, delay = 0) {
    try {
        // Delete the original command
        await message.delete().catch(() => {});
        
        if (delay > 0) {
            // If delay is specified, wait and then delete the response
            setTimeout(() => {
                response.delete().catch(() => {});
            }, delay);
        }
    } catch (error) {
        console.error('Error cleaning up messages:', error);
    }
}

export default {
    name: 'invite',
    description: 'Manage invites for users',
    async execute(message, args) {
        // Cooldown check
        const cooldownTime = 20000; // 20 seconds
        const now = Date.now();
        const timestamps = cooldowns.get(message.author.id);
        
        if (timestamps) {
            const expirationTime = timestamps + cooldownTime;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now);
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('⏰ Cooldown Active')
                    .setDescription(`Please wait ${formatTime(timeLeft)} before using this command again.`)
                    .setFooter({ text: `Requested by ${message.author.username}` });
                
                const reply = await message.channel.send({ embeds: [embed] });
                setTimeout(() => reply.delete().catch(() => {}), 5000);
                return;
            }
        }

        // Set cooldown
        cooldowns.set(message.author.id, now);
        setTimeout(() => cooldowns.delete(message.author.id), cooldownTime);

        // Check permissions first
        const hasPermission = message.member.roles.cache.has('1119670270077181962') || 
                             message.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasPermission) {
            try {
                // Delete the command message
                await message.delete().catch(() => {});

                // Send and quickly delete the permission denied message
                const reply = await message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('❌ Permission Denied')
                            .setDescription('You need administrator permissions or the required role to use this command.')
                    ]
                });

                // Delete the response after 2 seconds
                setTimeout(() => reply.delete().catch(() => {}), 2000);
                
                return;
            } catch (error) {
                console.error('Permission check error:', error);
                return;
            }
        }

        try {
            if (!args.length) {
                const helpEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('📨 Invite Command Usage')
                    .setDescription('Manage server invites with the following options:')
                    .addFields([
                        {
                            name: '🎭 Role-based Invite',
                            value: '`!invite role <@role>`\nSends invite to all users with specified role',
                            inline: false
                        },
                        {
                            name: '➕ Add Single Invite',
                            value: '`!invite add <@user>` or `!invite + <@user>`\nCreates and sends invite to specific user',
                            inline: false
                        },
                        {
                            name: '➖ Delete User\'s Invite',
                            value: '`!invite del <@user>` or `!invite - <@user>`\nDeletes invites for specific user',
                            inline: false
                        },
                        {
                            name: '🗑️ Delete All Invites',
                            value: '`!invite all del` or `!invite all -`\nDeletes all bot-created invites',
                            inline: false
                        }
                    ])
                    .addFields({
                        name: '📝 Examples',
                        value: 
                            '• `!invite role @Members`\n' +
                            '• `!invite + @username`\n' +
                            '• `!invite - 123456789`\n' +
                            '• `!invite all -`',
                        inline: false
                    })
                    .setFooter({ 
                        text: `Requested by ${message.author.username}`, 
                        iconURL: message.author.displayAvatarURL() 
                    });

                const response = await message.reply({ embeds: [helpEmbed] });
                await cleanupMessages(message, response, 30000); // Delete after 30 seconds
                return;
            }

            const action = args[0].toLowerCase();

            // Handle all invites deletion
            if (action === 'all' && (args[1] === 'del' || args[1] === '-')) {
                const loadingMsg = await message.reply('🔄 Retracting all active invites...');
                
                try {
                    const invites = await message.guild.invites.fetch();
                    const botInvites = invites.filter(invite => {
                        return invite.inviter && invite.inviter.id === message.client.user.id;
                    });
                    
                    if (botInvites.size === 0) {
                        return loadingMsg.edit('❌ No active invites found to retract.');
                    }

                    // Update DMs before deleting invites
                    await loadingMsg.edit('🔄 Updating invite messages...');
                    
                    // Process invites in smaller chunks to avoid rate limits
                    const chunkSize = 5;
                    for (let i = 0; i < botInvites.size; i += chunkSize) {
                        const chunk = Array.from(botInvites.values()).slice(i, i + chunkSize);
                        await Promise.all(chunk.map(invite => updateInviteDM(message.client, invite)));
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between chunks
                    }

                    // Then delete the invites
                    await loadingMsg.edit('🔄 Deleting invites...');
                    await Promise.all(botInvites.map(invite => invite.delete()));

                    const embed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('Invites Retracted')
                        .setDescription(`Successfully deleted ${botInvites.size} invite${botInvites.size !== 1 ? 's' : ''} and updated DM messages.`)
                        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

                    await loadingMsg.edit({ embeds: [embed] });
                    await cleanupMessages(message, loadingMsg, 10000); // Delete after 10 seconds

                    await logInviteAction(message.client, {
                        type: 'Bulk Deleted',
                        user: message.author,
                        guild: message.guild,
                        inviteCount: botInvites.size,
                        success: true
                    });

                } catch (error) {
                    console.error('Error deleting all invites:', error);
                    await loadingMsg.edit('❌ An error occurred while retracting invites.');
                    await cleanupMessages(message, loadingMsg, 5000); // Delete after 5 seconds

                    await logInviteAction(message.client, {
                        type: 'Bulk Deletion Failed',
                        user: message.author,
                        guild: message.guild,
                        success: false,
                        error: error.message
                    });
                }
                return;
            }

            // Handle single user invite deletion
            if (action === 'del' || action === '-') {
                if (!args[1]) return message.reply('Please specify a user ID or mention.');
                
                const userId = args[1].replace(/[<@!>]/g, '');
                const loadingMsg = await message.reply('🔄 Searching for user\'s invites...');

                try {
                    const invites = await message.guild.invites.fetch();
                    
                    // Debug log
                    console.log('Checking invites for user:', userId);
                    
                    const userInvites = invites.filter(invite => {
                        return invite.inviter && 
                               invite.inviter.id === message.client.user.id && 
                               invite.uses === 0; // Only get unused invites
                    });

                    if (userInvites.size === 0) {
                        return loadingMsg.edit('❌ No active invites found for this user.');
                    }

                    // Update DMs before deleting invites
                    await loadingMsg.edit('🔄 Updating invite messages...');
                    for (const invite of userInvites.values()) {
                        await updateInviteDM(message.client, invite);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    // Then delete the invites
                    await loadingMsg.edit('🔄 Deleting invites...');
                    await Promise.all(userInvites.map(invite => invite.delete()));

                    const embed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('Invite Retracted')
                        .setDescription(`Successfully deleted ${userInvites.size} invite${userInvites.size !== 1 ? 's' : ''} and updated DM messages.`)
                        .setFooter({ 
                            text: `Requested by ${message.author.username}`, 
                            iconURL: message.author.displayAvatarURL() 
                        });

                    await loadingMsg.edit({ embeds: [embed] });
                    await cleanupMessages(message, loadingMsg, 10000);

                    await logInviteAction(message.client, {
                        type: 'Deleted',
                        user: message.author,
                        guild: message.guild,
                        target: userId,
                        inviteCount: userInvites.size,
                        success: true
                    });

                } catch (error) {
                    console.error('Error deleting user invite:', error);
                    await loadingMsg.edit('❌ An error occurred while retracting the invite.');
                    await cleanupMessages(message, loadingMsg, 5000);

                    await logInviteAction(message.client, {
                        type: 'Deletion Failed',
                        user: message.author,
                        guild: message.guild,
                        target: userId,
                        success: false,
                        error: error.message
                    });
                }
                return;
            }

            // Handle single user invite creation
            if (action === 'add' || action === '+') {
                if (!args[1]) return message.reply('Please specify a user ID or mention.');
                
                const userId = args[1].replace(/[<@!>]/g, '');
                const loadingMsg = await message.reply('🔄 Creating invite...');

                try {
                    const user = await message.client.users.fetch(userId);
                    
                    const channel = message.guild.channels.cache
                        .filter(ch => ch.type === ChannelType.GuildText && 
                                ch.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite))
                        .first();

                    if (!channel) {
                        return loadingMsg.edit('❌ No suitable channel found for invite creation.');
                    }

                    // Create a single-use invite without targeting a user
                    const invite = await channel.createInvite({
                        maxUses: 1,
                        maxAge: 3600, // 1 hour
                        unique: true
                    });

                    try {
                        const inviteEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('🎫 Server Invite')
                            .setDescription('You have received a single-use invite link.')
                            .addFields(
                                { name: 'Invite Link', value: invite.url },
                                { name: 'Details', value: '• Single-use only\n• Expires in 1 hour' }
                            )
                            .setTimestamp();

                        await user.send({ embeds: [inviteEmbed] });
                        
                        const embed = new EmbedBuilder()
                            .setColor('Green')
                            .setTitle('Invite Created')
                            .setDescription(`✅ Successfully created and sent invite to <@${userId}>.`)
                            .addFields({
                                name: 'Details',
                                value: '• Single-use invite\n• Expires in 1 hour'
                            })
                            .setFooter({ 
                                text: `Requested by ${message.author.username}`, 
                                iconURL: message.author.displayAvatarURL() 
                            })
                            .setTimestamp();

                        await loadingMsg.edit({ embeds: [embed] });
                        await cleanupMessages(message, loadingMsg, 10000);

                        await logInviteAction(message.client, {
                            type: 'Created',
                            user: message.author,
                            guild: message.guild,
                            target: user,
                            success: true
                        });

                    } catch (dmError) {
                        // If we can't DM the user, show the invite in the channel
                        const embed = new EmbedBuilder()
                            .setColor('Yellow')
                            .setTitle('⚠️ Invite Created')
                            .setDescription(`Could not send DM to <@${userId}>. Here's the invite link:`)
                            .addFields(
                                { name: 'Invite URL', value: invite.url },
                                { name: 'Details', value: '• Single-use invite\n• Expires in 1 hour' }
                            )
                            .setFooter({ 
                                text: `Requested by ${message.author.username}`, 
                                iconURL: message.author.displayAvatarURL() 
                            })
                            .setTimestamp();

                        await loadingMsg.edit({ embeds: [embed] });
                    }
                } catch (error) {
                    console.error('Error creating invite:', error);
                    await loadingMsg.edit('❌ An error occurred while creating the invite.');
                    await cleanupMessages(message, loadingMsg, 5000);

                    await logInviteAction(message.client, {
                        type: 'Creation Failed',
                        user: message.author,
                        guild: message.guild,
                        target: userId,
                        success: false,
                        error: error.message
                    });
                }
                return;
            }

            // Original role-based invite functionality
            if (action === 'role') {
                if (!args.length) {
                    return message.reply('Please mention a role.');
                }

                // Get the role from mentions or try to find it by name/ID
                const roleInput = args[0];
                let role = message.mentions.roles.first() || 
                          message.guild.roles.cache.get(roleInput) ||
                          message.guild.roles.cache.find(r => r.name.toLowerCase() === roleInput.toLowerCase());

                if (!role) {
                    console.error('Role not found or invalid.');
                    return message.reply('Please mention a valid role.');
                }

                const inviteOptions = {
                    maxUses: 1,    // Single-use
                    maxAge: 3600,   // 1 hour (3600 seconds)
                };

                const channel = message.guild.channels.cache
                    .filter(ch => ch.type === ChannelType.GuildText && ch.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite))
                    .first();

                if (!channel) {
                    return message.reply('No suitable text channel found for invite creation.');
                }

                const invite = await channel.createInvite(inviteOptions);
                console.log('Generated invite URL:', invite.url);

                // Get members with the role from the cache first
                let membersWithRole = message.guild.members.cache
                    .filter(member => member.roles.cache.has(role.id));

                // If the cache is empty, try to fetch members
                if (membersWithRole.size === 0) {
                    try {
                        const fetchedMembers = await message.guild.members.fetch({ time: 10000 });
                        membersWithRole = fetchedMembers.filter(member => member.roles.cache.has(role.id));
                    } catch (fetchError) {
                        console.error('Error fetching members:', fetchError);
                        // Continue with cached members if fetch fails
                    }
                }

                console.log(`Found ${membersWithRole.size} members with the role ${role.name}`);

                if (membersWithRole.size === 0) {
                    return message.reply(`No members found with the role **${role.name}**.`);
                }

                // Send a loading message
                const loadingMsg = await message.reply(`Sending invite link to ${membersWithRole.size} members...`);

                // Modified DM handling to catch errors for individual users
                const dmResults = await Promise.allSettled(
                    membersWithRole.map(async member => {
                        try {
                            const inviteEmbed = new EmbedBuilder()
                                .setColor('#00ff00')
                                .setTitle('🎫 Server Invite')
                                .setDescription('You have received a single-use invite link.')
                                .addFields(
                                    { name: 'Invite Link', value: invite.url },
                                    { name: 'Details', value: '• Single-use only\n• Expires in 1 hour' }
                                )
                                .setTimestamp();

                            await member.send({ embeds: [inviteEmbed] });
                            console.log(`Successfully sent DM to ${member.user.tag}`);
                            return true;
                        } catch (error) {
                            console.log(`Failed to send DM to ${member.user.tag}: ${error.message}`);
                            return false;
                        }
                    })
                );

                const successfulDMs = dmResults.filter(result => result.status === 'fulfilled' && result.value === true).length;
                const failedDMs = membersWithRole.size - successfulDMs;

                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Invite Link Sent')
                    .setDescription(`Results of invite link distribution for role **${role.name}**:
                    • Successfully sent to: ${successfulDMs} members
                    ${failedDMs > 0 ? `• Failed to send to: ${failedDMs} members (likely due to DM settings)` : ''}`)
                    .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

                // Edit the loading message with the results
                await loadingMsg.edit({ content: null, embeds: [embed] });
                await cleanupMessages(message, loadingMsg, 10000);

            } else {
                const response = await message.reply('Invalid action. Use: `role <role>`, `add/+ <user>`, `del/- <user>`, or `all del/-`');
                await cleanupMessages(message, response, 5000);
            }

        } catch (error) {
            console.error('Error in invite command:', error);
            await message.reply('An error occurred while processing the invite command.');
        }
    },
};