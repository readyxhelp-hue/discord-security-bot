import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { saveVerificationConfig } from './store.js';

export const defaultVerificationPanel = {
  guildId: process.env.DISCORD_GUILD_ID || '1508006788312862791',
  channelId: process.env.VERIFY_CHANNEL_ID || '1508019418733740122',
  roleId: process.env.VERIFY_ROLE_ID || '1508019020476055722',
  emoji: process.env.VERIFY_EMOJI || '✅',
  title: process.env.VERIFY_TITLE || 'Access Verification',
  description:
    process.env.VERIFY_DESCRIPTION ||
    'กรุณายืนยันตัวตนก่อนเข้าใช้งานพื้นที่หลักของเซิร์ฟเวอร์ เพื่อช่วยรักษาความปลอดภัยและคุณภาพของชุมชน',
  removeRoleOnUnreact: process.env.VERIFY_REMOVE_ON_UNREACT === 'true'
};

export function botCanManageRole(guild, role) {
  const botMember = guild.members.me;
  return botMember.permissions.has(PermissionFlagsBits.ManageRoles) && role.position < botMember.roles.highest.position;
}

export function buildVerificationEmbed({ guild, title, description, emoji, role }) {
  const embed = new EmbedBuilder()
    .setColor(0xe93f75)
    .setAuthor({
      name: `${guild.name} Security`,
      iconURL: guild.iconURL({ size: 128 }) ?? undefined
    })
    .setTitle(title)
    .setDescription(description)
    .addFields(
      {
        name: 'ขั้นตอนการยืนยัน',
        value: `กด reaction ${emoji} ใต้ข้อความนี้`,
        inline: true
      },
      {
        name: 'สิทธิ์หลังยืนยัน',
        value: `ระบบจะมอบยศ ${role} ให้อัตโนมัติ`,
        inline: true
      },
      {
        name: 'ข้อตกลง',
        value: 'การยืนยันหมายถึงคุณยอมรับกฎของเซิร์ฟเวอร์ และพร้อมใช้งานอย่างสุภาพ',
        inline: false
      }
    )
    .setFooter({ text: 'Byte Security • Verification Gate' })
    .setTimestamp();

  const iconUrl = guild.iconURL({ size: 256 });
  if (iconUrl) {
    embed.setThumbnail(iconUrl);
  }

  return embed;
}

export async function createVerificationPanel({
  guild,
  channel,
  role,
  emoji,
  title,
  description,
  removeRoleOnUnreact
}) {
  if (!botCanManageRole(guild, role)) {
    throw new Error(`Bot cannot manage role ${role.name}. Move the bot role above it and grant Manage Roles.`);
  }

  const embed = buildVerificationEmbed({
    guild,
    title,
    description,
    emoji,
    role
  });

  const message = await channel.send({ embeds: [embed] });
  await message.react(emoji);

  await saveVerificationConfig({
    enabled: true,
    guildId: guild.id,
    channelId: channel.id,
    messageId: message.id,
    roleId: role.id,
    emoji,
    removeRoleOnUnreact
  });

  return message;
}
