import { EmbedBuilder } from 'discord.js';
import { securityConfig } from './config.js';

export async function logSecurityAction(guild, title, details = {}) {
  if (!securityConfig.logChannelId) return;

  try {
    const channel = await guild.channels.fetch(securityConfig.logChannelId);
    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(details.color ?? 0xe93f75)
      .setTitle(title)
      .setTimestamp();

    if (details.description) {
      embed.setDescription(details.description);
    }

    if (details.fields?.length) {
      embed.addFields(details.fields);
    }

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.warn('Could not write security log:', error.message);
  }
}
