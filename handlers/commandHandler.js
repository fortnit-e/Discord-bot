import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(client) {
    try {
        client.commands = new Collection();
        const commandsPath = path.join(__dirname, '..', 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const filePath = `file:///${path.join(commandsPath, file).replace(/\\/g, '/')}`;
                const command = (await import(filePath)).default;
                
                if ('name' in command && 'execute' in command) {
                    client.commands.set(command.name, command);
                    console.log(`Loaded command: ${command.name}`);
                } else {
                    console.warn(`Command at ${file} is missing required properties`);
                }
            } catch (error) {
                await logError(client, error, {
                    command: 'Command Loading',
                    file: file,
                    type: 'Command Handler Error'
                });
                console.error(`Error loading command ${file}:`, error);
            }
        }
    } catch (error) {
        await logError(client, error, {
            command: 'Command Handler',
            type: 'Fatal Error',
            error: error.stack
        });
        console.error('Fatal error in command handler:', error);
    }
}