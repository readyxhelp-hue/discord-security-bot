import 'dotenv/config';
import { PermissionFlagsBits } from 'discord.js';

const clientId = process.env.DISCORD_CLIENT_ID;

if (!clientId) {
  throw new Error('Missing DISCORD_CLIENT_ID in .env.');
}

const permissions =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.ReadMessageHistory |
  PermissionFlagsBits.AddReactions |
  PermissionFlagsBits.ManageMessages |
  PermissionFlagsBits.ModerateMembers |
  PermissionFlagsBits.ManageRoles |
  PermissionFlagsBits.ManageGuild;

const params = new URLSearchParams({
  client_id: clientId,
  permissions: permissions.toString(),
  scope: 'bot applications.commands'
});

console.log(`https://discord.com/oauth2/authorize?${params.toString()}`);
