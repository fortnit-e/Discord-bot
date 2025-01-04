import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = `file:///${path.join(commandsPath, file).replace(/\\/g, '/')}`;
    import(filePath).then((commandModule) => {
      const command = commandModule.default;
      if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`);
      }
    });
  }
}