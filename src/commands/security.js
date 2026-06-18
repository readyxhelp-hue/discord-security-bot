import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { securityConfig } from '../security/config.js';
import { setupAutoMod } from '../security/automod.js';

export const data = new SlashCommandBuilder()
  .setName('security')
  .setDescription('Manage server protection.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((subcommand) =>
    subcommand.setName('status').setDescription('Show the current protection settings.')
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('automod').setDescription('Create or update recommended Discord AutoMod rules.')
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'automod') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { diagnostics, results } = await setupAutoMod(interaction.guild);
      const applied = results.filter((result) => result.status === 'applied');
      const skipped = results.filter((result) => result.status === 'skipped');

      await interaction.editReply({
        content: [
          '**Discord AutoMod updated**',
          `Manage Server: ${diagnostics.hasManageGuild}`,
          '',
          '**Applied**',
          ...(applied.length > 0 ? applied.map((result) => `- ${result.name}`) : ['- none']),
          '',
          '**Skipped**',
          ...(skipped.length > 0
            ? skipped.map((result) => `- ${result.name}: ${result.reason}`)
            : ['- none'])
        ].join('\n')
      });
    } catch (error) {
      await interaction.editReply({
        content: `AutoMod setup failed: ${error.message}`
      });
    }
    return;
  }

  await interaction.reply({
    ephemeral: true,
    content: [
      '**Protection is active**',
      `Auto-react channel: <#${securityConfig.autoReactChannelId}>`,
      `Auto-react emoji: ${securityConfig.autoReactEmoji}`,
      `Timeout seconds: ${securityConfig.timeoutSeconds}`,
      `Spam limit: ${securityConfig.maxMessagesPer10Seconds} messages / 10s`,
      `Duplicate limit: ${securityConfig.maxDuplicateMessages}`,
      `Emoji limit: ${securityConfig.maxEmojisPerMessage}`,
      `Caps limit: ${securityConfig.maxCapsPercent}% after ${securityConfig.minCapsLength} letters`,
      `Mention limit: ${securityConfig.maxMentionsPerMessage}`,
      `New account threshold: ${securityConfig.maxJoinAgeMinutes} minutes`,
      `Join raid threshold: ${securityConfig.maxJoinsPer60Seconds} joins / 60s`,
      `Block invites: ${securityConfig.blockInvites}`,
      `Block links: ${securityConfig.blockLinks}`,
      `Block link shorteners: ${securityConfig.blockLinkShorteners}`,
      `Block phishing terms: ${securityConfig.blockPhishingTerms}`,
      `Block suspicious attachments: ${securityConfig.blockSuspiciousAttachments}`,
      `AutoMod prefix: ${securityConfig.automodPrefix}`
    ].join('\n')
  });
}
