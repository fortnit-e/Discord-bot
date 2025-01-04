import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
import { loadEvents } from './handlers/eventHandler.js';
import { loadCommands } from './handlers/commandHandler.js';
import { spawn } from 'child_process';
import express from 'express';
import { CooldownManager } from './utils/cooldownManager.js';

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

    // Check if we need to update a restart message
    if (process.env.RESTART_CHANNEL && process.env.RESTART_MESSAGE) {
        try {
            const channel = await client.channels.fetch(process.env.RESTART_CHANNEL);
            if (!channel) {
                console.error('Could not find restart channel');
                return;
            }

            const message = await channel.messages.fetch(process.env.RESTART_MESSAGE);
            if (!message) {
                console.error('Could not find restart message');
                return;
            }

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Bot Restarted')
                .setDescription('Bot has successfully restarted!')
                .setTimestamp();

            await message.edit({ embeds: [successEmbed] });
            console.log('Updated restart message successfully');

        } catch (error) {
            console.error('Error updating restart message:', error);
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