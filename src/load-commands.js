import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');

export async function loadCommands() {
  const commandFiles = (await readdir(commandsPath)).filter((file) => file.endsWith('.js'));
  const commands = [];

  for (const file of commandFiles) {
    const command = await import(pathToFileURL(path.join(commandsPath, file)).href);

    if (!command.data || !command.execute) {
      throw new Error(`${file} must export both data and execute.`);
    }

    commands.push(command);
  }

  return commands;
}
