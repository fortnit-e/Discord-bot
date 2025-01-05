import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logError } from '../utils/errorLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = `file:///${path.join(eventsPath, file).replace(/\\/g, '/')}`;
    import(filePath).then((eventModule) => {
      const event = eventModule.default;
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    });
  }

  process.on('unhandledRejection', async (error) => {
    await logError(client, error, {
      command: 'Unhandled Rejection',
      error: error.stack
    });
  });

  process.on('uncaughtException', async (error) => {
    await logError(client, error, {
      command: 'Uncaught Exception',
      error: error.stack
    });
  });
}