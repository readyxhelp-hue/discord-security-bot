import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('server-scan')
  .setDescription('Show useful server IDs for setup.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

function formatChannel(channel) {
  const type = ChannelType[channel.type] ?? channel.type;
  return `#${channel.name} | ${channel.id} | ${type}`;
}

function formatRole(role) {
  return `${role.name} | ${role.id} | pos ${role.position}`;
}

function trimBlock(lines, maxLength = 1700) {
  const text = lines.join('\n');
  if (text.length <= maxLength) return text || 'None';
  return `${text.slice(0, maxLength)}\n...`;
}

export async function execute(interaction) {
  const channels = [...interaction.guild.channels.cache.values()]
    .sort((a, b) => a.rawPosition - b.rawPosition)
    .map(formatChannel);

  const roles = [...interaction.guild.roles.cache.values()]
    .filter((role) => role.name !== '@everyone')
    .sort((a, b) => b.position - a.position)
    .map(formatRole);

  await interaction.reply({
    ephemeral: true,
    content: [
      `**${interaction.guild.name} scan**`,
      '',
      '**Channels**',
      '```',
      trimBlock(channels),
      '```',
      '**Roles**',
      '```',
      trimBlock(roles),
      '```'
    ].join('\n')
  });
}
