import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getVerificationConfig, saveVerificationConfig } from '../verification/store.js';
import { botCanManageRole, createVerificationPanel } from '../verification/setup-panel.js';

export const data = new SlashCommandBuilder()
  .setName('verify')
  .setDescription('Manage reaction-based verification.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('setup')
      .setDescription('Create a verification panel.')
      .addChannelOption((option) =>
        option
          .setName('channel')
          .setDescription('Channel where the verification panel will be posted.')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      )
      .addRoleOption((option) =>
        option
          .setName('role')
          .setDescription('Role users receive after reacting.')
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('emoji')
          .setDescription('Emoji users must react with.')
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName('title')
          .setDescription('Verification panel title.')
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName('description')
          .setDescription('Verification panel description.')
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName('remove_on_unreact')
          .setDescription('Remove the role if the user removes their reaction.')
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('status').setDescription('Show verification settings.')
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('disable').setDescription('Disable reaction verification.')
  );

async function setupVerification(interaction) {
  const channel = interaction.options.getChannel('channel', true);
  const role = interaction.options.getRole('role', true);
  const emoji = interaction.options.getString('emoji') ?? '✅';
  const title = interaction.options.getString('title') ?? 'Access Verification';
  const description =
    interaction.options.getString('description') ??
    'กรุณายืนยันตัวตนก่อนเข้าใช้งานพื้นที่หลักของเซิร์ฟเวอร์ เพื่อช่วยรักษาความปลอดภัยและคุณภาพของชุมชน';
  const removeRoleOnUnreact = interaction.options.getBoolean('remove_on_unreact') ?? false;

  if (!botCanManageRole(interaction.guild, role)) {
    await interaction.reply({
      ephemeral: true,
      content: `บอทยังให้ role ${role} ไม่ได้ ต้องมี permission Manage Roles และ role ของบอทต้องอยู่สูงกว่า role นี้`
    });
    return;
  }

  const message = await createVerificationPanel({
    guild: interaction.guild,
    channel,
    role,
    emoji,
    title,
    description,
    removeRoleOnUnreact
  });

  await interaction.reply({
    ephemeral: true,
    content: `ตั้งค่า verify panel แล้ว: ${message.url}`
  });
}

async function showStatus(interaction) {
  const config = await getVerificationConfig();

  if (!config.enabled) {
    await interaction.reply({ ephemeral: true, content: 'Reaction verification is disabled.' });
    return;
  }

  await interaction.reply({
    ephemeral: true,
    content: [
      '**Reaction verification**',
      `Channel: <#${config.channelId}>`,
      `Message ID: ${config.messageId}`,
      `Role: <@&${config.roleId}>`,
      `Emoji: ${config.emoji}`,
      `Remove role on unreact: ${config.removeRoleOnUnreact}`
    ].join('\n')
  });
}

async function disableVerification(interaction) {
  const config = await getVerificationConfig();

  await saveVerificationConfig({
    ...config,
    enabled: false
  });

  await interaction.reply({ ephemeral: true, content: 'Reaction verification disabled.' });
}

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'setup') {
    await setupVerification(interaction);
    return;
  }

  if (subcommand === 'status') {
    await showStatus(interaction);
    return;
  }

  if (subcommand === 'disable') {
    await disableVerification(interaction);
  }
}
