import { Events, PermissionFlagsBits } from 'discord.js';
import { securityConfig } from './config.js';
import { logSecurityAction } from './log.js';

const userWindows = new Map();
const joinWindow = [];

const invitePattern = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-z0-9-]+/i;
const urlPattern = /https?:\/\/[^\s<]+/gi;
const suspiciousAttachmentPattern = /\.(exe|scr|bat|cmd|com|pif|msi|vbs|js|jar|ps1|hta)$/i;
const customEmojiPattern = /<a?:\w+:\d+>/g;
const unicodeEmojiPattern = /\p{Extended_Pictographic}/gu;
const zeroWidthPattern = /[\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g;

function canBypass(member) {
  return member?.permissions?.has(PermissionFlagsBits.ManageMessages) || member?.permissions?.has(PermissionFlagsBits.Administrator);
}

function rememberMessage(message) {
  const now = Date.now();
  const key = `${message.guildId}:${message.author.id}`;
  const window = userWindows.get(key) ?? [];
  const normalized = message.content.trim().toLowerCase();
  const recent = window.filter((entry) => now - entry.createdAt < 10_000);
  const accountAgeMinutes = Math.floor((now - message.author.createdTimestamp) / 60_000);

  recent.push({ createdAt: now, content: normalized, accountAgeMinutes });
  userWindows.set(key, recent);

  const duplicateCount = recent.filter((entry) => entry.content && entry.content === normalized).length;

  return {
    messageCount: recent.length,
    duplicateCount,
    accountAgeMinutes
  };
}

function normalizeContent(content) {
  return content
    .normalize('NFKC')
    .replace(zeroWidthPattern, '')
    .replace(/[^\p{Letter}\p{Number}:/.]+/gu, ' ')
    .toLowerCase();
}

function getUrls(content) {
  return content.match(urlPattern) ?? [];
}

function hasBlockedLink(content) {
  const urls = getUrls(content);

  if (urls.length === 0) return false;
  if (securityConfig.allowedDomains.length === 0) return true;

  return urls.some((rawUrl) => {
    try {
      const hostname = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
      return !securityConfig.allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    } catch {
      return true;
    }
  });
}

function hasLinkShortener(content) {
  return getUrls(content).some((rawUrl) => {
    try {
      const hostname = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
      return securityConfig.linkShortenerDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    } catch {
      return false;
    }
  });
}

function hasPhishingTerms(content) {
  const normalized = normalizeContent(content);
  return securityConfig.phishingTerms.some((term) => normalized.includes(term));
}

function hasObfuscatedInvite(content) {
  const normalized = normalizeContent(content).replace(/\s+/g, '');
  return /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\//i.test(normalized);
}

function countEmojis(content) {
  const custom = content.match(customEmojiPattern)?.length ?? 0;
  const unicode = content.match(unicodeEmojiPattern)?.length ?? 0;
  return custom + unicode;
}

function capsPercent(content) {
  const letters = [...content].filter((char) => /\p{Letter}/u.test(char));
  if (letters.length < securityConfig.minCapsLength) return 0;

  const caps = letters.filter((char) => char === char.toUpperCase() && char !== char.toLowerCase());
  return Math.round((caps.length / letters.length) * 100);
}

function getViolation(message) {
  const content = message.content ?? '';
  const mentions = message.mentions.users.size + message.mentions.roles.size;
  const stats = rememberMessage(message);

  if (stats.messageCount > securityConfig.maxMessagesPer10Seconds) {
    return 'message spam';
  }

  if (stats.duplicateCount >= securityConfig.maxDuplicateMessages) {
    return 'duplicate spam';
  }

  if (
    stats.accountAgeMinutes < securityConfig.freshAccountStrictMinutes &&
    stats.messageCount >= securityConfig.freshAccountSpamMessages
  ) {
    return 'fresh account burst';
  }

  if (securityConfig.blockInvites && (invitePattern.test(content) || hasObfuscatedInvite(content))) {
    return 'Discord invite link';
  }

  if (securityConfig.blockLinkShorteners && hasLinkShortener(content)) {
    return 'link shortener';
  }

  if (securityConfig.blockLinks && hasBlockedLink(content)) {
    return 'blocked link';
  }

  if (securityConfig.blockPhishingTerms && hasPhishingTerms(content)) {
    return 'phishing phrase';
  }

  if (securityConfig.blockMassMentions && mentions > securityConfig.maxMentionsPerMessage) {
    return 'mass mentions';
  }

  if (countEmojis(content) > securityConfig.maxEmojisPerMessage) {
    return 'emoji flood';
  }

  if (capsPercent(content) > securityConfig.maxCapsPercent) {
    return 'caps flood';
  }

  if (securityConfig.bannedWords.some((word) => content.toLowerCase().includes(word))) {
    return 'banned word';
  }

  if (
    securityConfig.blockSuspiciousAttachments &&
    message.attachments.some((attachment) => suspiciousAttachmentPattern.test(attachment.name ?? attachment.url))
  ) {
    return 'suspicious attachment';
  }

  return null;
}

async function timeoutMember(member, reason) {
  if (!member?.moderatable || securityConfig.timeoutSeconds <= 0) return false;

  await member.timeout(securityConfig.timeoutSeconds * 1000, reason);
  return true;
}

async function handleAutoReact(message) {
  if (message.channelId !== securityConfig.autoReactChannelId) return;

  try {
    await message.react(securityConfig.autoReactEmoji);
  } catch (error) {
    console.warn(`Could not react in channel ${message.channelId}:`, error.message);
  }
}

async function handleMessage(message) {
  if (!message.guild || message.author.bot) return;

  await handleAutoReact(message);

  if (canBypass(message.member)) return;

  const violation = getViolation(message);
  if (!violation) return;

  try {
    if (message.deletable) {
      await message.delete();
    }

    const timedOut = await timeoutMember(message.member, `Protection: ${violation}`);
    const action = timedOut ? 'deleted and timed out' : 'deleted';

    await logSecurityAction(
      message.guild,
      'Message Protection',
      {
        description: `Protection ${action} a message in <#${message.channelId}>.`,
        fields: [
          { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: false },
          { name: 'Reason', value: violation, inline: true },
          { name: 'Action', value: action, inline: true }
        ]
      }
    );
  } catch (error) {
    console.warn('Protection action failed:', error.message);
  }
}

async function handleJoin(member) {
  const now = Date.now();
  joinWindow.push(now);

  while (joinWindow.length > 0 && now - joinWindow[0] > 60_000) {
    joinWindow.shift();
  }

  const accountAgeMinutes = Math.floor((now - member.user.createdTimestamp) / 60_000);
  const freshAccount = accountAgeMinutes < securityConfig.maxJoinAgeMinutes;
  const raidSpike = joinWindow.length > securityConfig.maxJoinsPer60Seconds;

  if (!freshAccount && !raidSpike) return;

  const reason = freshAccount
    ? `Protection: new account (${accountAgeMinutes} minutes old)`
    : `Protection: join raid spike (${joinWindow.length} joins/minute)`;

  try {
    const timedOut = await timeoutMember(member, reason);

    await logSecurityAction(
      member.guild,
      'Join Protection',
      {
        description: `${member.user.tag} was reviewed by join protection.`,
        fields: [
          { name: 'User', value: `${member.user.tag} (${member.id})`, inline: false },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Action', value: timedOut ? 'timed out' : 'logged only', inline: true }
        ]
      }
    );
  } catch (error) {
    console.warn('Join protection failed:', error.message);
  }
}

async function handleAutoModAction(action) {
  const guild = action.guild;
  if (!guild) return;

  await logSecurityAction(guild, 'Discord AutoMod Triggered', {
    description: `Rule: ${action.ruleName ?? action.ruleId}`,
    fields: [
      { name: 'User', value: action.userId ? `<@${action.userId}> (${action.userId})` : 'Unknown', inline: false },
      { name: 'Channel', value: action.channelId ? `<#${action.channelId}>` : 'Unknown', inline: true },
      { name: 'Matched', value: action.matchedKeyword ?? 'N/A', inline: true }
    ]
  });
}

export function registerProtection(client) {
  client.on(Events.MessageCreate, handleMessage);
  client.on(Events.GuildMemberAdd, handleJoin);
  client.on(Events.AutoModerationActionExecution, handleAutoModAction);
}
