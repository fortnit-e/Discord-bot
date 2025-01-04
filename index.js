import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
import { loadEvents } from './handlers/eventHandler.js';
import { loadCommands } from './handlers/commandHandler.js';
import { spawn } from 'child_process';
import express from 'express';
import { CooldownManager } from './utils/cooldownManager.js';
import { setTimeout as wait } from 'timers/promises';

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

    // Check if this is a restart
    if (process.env.RESTART_CHANNEL && process.env.RESTART_MESSAGE) {
        try {
            // Add retry logic for fetching channel and message
            let channel;
            let retries = 0;
            const maxRetries = 3;

            while (!channel && retries < maxRetries) {
                try {
                    channel = await client.channels.fetch(process.env.RESTART_CHANNEL);
                } catch (error) {
                    retries++;
                    await wait(2000); // Wait 2 seconds between retries
                }
            }

            if (!channel) {
                console.error('Failed to fetch restart channel after retries');
                return;
            }

            const message = await channel.messages.fetch(process.env.RESTART_MESSAGE);
            const restartDuration = process.env.RESTART_TIME ? 
                Math.floor((Date.now() - parseInt(process.env.RESTART_TIME)) / 1000) :
                'Unknown';

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Bot Online')
                .setDescription(
                    '**Status:**\n' +
                    '• Restart completed successfully\n' +
                    '• All systems operational\n\n' +
                    `**Details:**\n` +
                    `• Restart duration: ${restartDuration} seconds\n` +
                    `• Requested by: ${process.env.RESTART_REQUESTER || 'Unknown'}\n\n` +
                    '**Ready:**\n' +
                    '• Bot is now accepting commands'
                )
                .setTimestamp();

            await message.edit({ embeds: [successEmbed] });
            console.log('Restart completed successfully');

            // Clear restart variables
            delete process.env.RESTART_CHANNEL;
            delete process.env.RESTART_MESSAGE;
            delete process.env.RESTART_TIME;
            delete process.env.RESTART_REQUESTER;

        } catch (error) {
            console.error('Error during restart completion:', error);
        }
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