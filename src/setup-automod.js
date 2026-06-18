import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { setupAutoMod } from './security/automod.js';

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || token === 'replace_with_new_rotated_bot_token') {
  throw new Error('Missing a valid DISCORD_TOKEN in .env.');
}

if (!guildId) {
  throw new Error('Missing DISCORD_GUILD_ID in .env.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, async () => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const { diagnostics, results } = await setupAutoMod(guild);
    const applied = results.filter((result) => result.status === 'applied');
    const skipped = results.filter((result) => result.status === 'skipped');

    console.log(`AutoMod diagnostics: ${JSON.stringify(diagnostics)}`);
    console.log(`AutoMod applied: ${applied.map((result) => result.name).join(', ') || 'none'}`);

    if (skipped.length > 0) {
      console.log('AutoMod skipped optional rules:');
      for (const result of skipped) {
        console.log(`- ${result.name}: ${result.reason}`);
      }
    }
  } finally {
    client.destroy();
  }
});

await client.login(token);
