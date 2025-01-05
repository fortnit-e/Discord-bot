import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
import { loadEvents } from './handlers/eventHandler.js';
import { loadCommands } from './handlers/commandHandler.js';
import { spawn } from 'child_process';
import express from 'express';
import { CooldownManager } from './utils/cooldownManager.js';
import { setTimeout as wait } from 'timers/promises';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

config(); // Load environment variables

// Check for required environment variables
if (!process.env.DISCORD_TOKEN || !process.env.YUNITE_API_KEY) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ],
});

// Load handlers
loadEvents(client);
loadCommands(client);

// Set the prefix
client.prefix = '!';

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Add this after client login
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Bot is starting...');

    try {
        // Check for restart file
        const restartInfo = JSON.parse(await fs.readFile(RESTART_FILE, 'utf8').catch(() => '{}'));
        
        if (restartInfo.channelId && restartInfo.messageId) {
            const channel = await client.channels.fetch(restartInfo.channelId);
            if (channel) {
                const message = await channel.messages.fetch(restartInfo.messageId);
                if (message) {
                    const restartDuration = Math.floor((Date.now() - restartInfo.time) / 1000);

                    const successEmbed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('✅ Bot Online')
                        .setDescription(
                            '**Status:**\n' +
                            '• Restart completed successfully\n' +
                            '• All systems operational\n\n' +
                            `**Details:**\n` +
                            `• Restart duration: ${restartDuration} seconds\n` +
                            `• Requested by: ${restartInfo.requester || 'Unknown'}\n\n` +
                            '**Ready:**\n' +
                            '• Bot is now accepting commands'
                        )
                        .setTimestamp();

                    await message.edit({ embeds: [successEmbed] });
                    console.log('Restart completed successfully');
                }
            }

            // Delete the restart file
            await fs.unlink(RESTART_FILE).catch(() => {});
        }
    } catch (error) {
        console.error('Error handling restart completion:', error);
    }
});

// Remove the previous exit handler and replace with this
process.on('SIGINT', () => {
    console.log('Bot shutting down...');
    process.exit(0);
});

const PORT = process.env.PORT || 3000;
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add after creating the client
client.cooldowns = new CooldownManager();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESTART_FILE = path.join(__dirname, 'restart-info.json');