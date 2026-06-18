import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { loadCommands } from './load-commands.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error('Missing DISCORD_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID in .env.');
}

const commands = (await loadCommands()).map((command) => command.data.toJSON());
const rest = new REST().setToken(token);

console.log(`Deploying ${commands.length} guild command(s)...`);

await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
  body: commands
});

console.log('Slash commands deployed.');
