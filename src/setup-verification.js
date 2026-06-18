import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { createVerificationPanel, defaultVerificationPanel } from './verification/setup-panel.js';

const token = process.env.DISCORD_TOKEN;

if (!token || token === 'replace_with_new_rotated_bot_token') {
  throw new Error('Missing a valid DISCORD_TOKEN in .env.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel]
});

client.once('ready', async () => {
  try {
    const guild = await client.guilds.fetch(defaultVerificationPanel.guildId);
    const fullGuild = await guild.fetch();
    const channel = await fullGuild.channels.fetch(defaultVerificationPanel.channelId);
    const role = await fullGuild.roles.fetch(defaultVerificationPanel.roleId);

    if (!channel?.isTextBased()) {
      throw new Error(`Verify channel ${defaultVerificationPanel.channelId} is not a text channel.`);
    }

    if (!role) {
      throw new Error(`Verify role ${defaultVerificationPanel.roleId} was not found.`);
    }

    const message = await createVerificationPanel({
      guild: fullGuild,
      channel,
      role,
      emoji: defaultVerificationPanel.emoji,
      title: defaultVerificationPanel.title,
      description: defaultVerificationPanel.description,
      removeRoleOnUnreact: defaultVerificationPanel.removeRoleOnUnreact
    });

    console.log(`Verification panel created: ${message.url}`);
  } finally {
    client.destroy();
  }
});

await client.login(token);
