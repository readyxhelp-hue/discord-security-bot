import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleKeywordPresetType,
  AutoModerationRuleTriggerType,
  PermissionFlagsBits
} from 'discord.js';
import { securityConfig } from './config.js';

const missingAccessCodes = new Set([50001, 50013]);

function blockAction(message) {
  return {
    type: AutoModerationActionType.BlockMessage,
    metadata: {
      customMessage: message
    }
  };
}

function timeoutAction() {
  return {
    type: AutoModerationActionType.Timeout,
    metadata: {
      durationSeconds: securityConfig.automodTimeoutSeconds
    }
  };
}

function alertAction() {
  if (!securityConfig.logChannelId) return null;

  return {
    type: AutoModerationActionType.SendAlertMessage,
    metadata: {
      channel: securityConfig.logChannelId
    }
  };
}

function actions({ timeout = false, message }) {
  return [blockAction(message), alertAction(), timeout ? timeoutAction() : null].filter(Boolean);
}

function ruleName(name) {
  return `${securityConfig.automodPrefix}: ${name}`;
}

function isDiscordAccessError(error) {
  return error?.status === 403 || missingAccessCodes.has(error?.code);
}

async function getBotMember(guild) {
  if (guild.members.me) return guild.members.me;
  return guild.members.fetchMe();
}

export async function getAutoModDiagnostics(guild) {
  const botMember = await getBotMember(guild);
  const permissions = botMember.permissions;

  return {
    botId: guild.client.user.id,
    guildId: guild.id,
    guildName: guild.name,
    hasManageGuild: permissions.has(PermissionFlagsBits.ManageGuild),
    hasModerateMembers: permissions.has(PermissionFlagsBits.ModerateMembers),
    hasManageMessages: permissions.has(PermissionFlagsBits.ManageMessages),
    hasManageRoles: permissions.has(PermissionFlagsBits.ManageRoles)
  };
}

async function upsertRule(guild, options) {
  const rules = await guild.autoModerationRules.fetch();
  const existing = rules.find((rule) => rule.name === options.name);

  if (existing) {
    const { triggerType, ...editableOptions } = options;
    return existing.edit(editableOptions, 'Update Byte Guard AutoMod rule');
  }

  return guild.autoModerationRules.create(options);
}

async function applyRule(guild, options, { optional = false } = {}) {
  try {
    const rule = await upsertRule(guild, options);
    return {
      status: 'applied',
      name: rule.name,
      rule
    };
  } catch (error) {
    if (optional && isDiscordAccessError(error)) {
      return {
        status: 'skipped',
        name: options.name,
        reason:
          'Discord returned Missing Access for this optional rule. This usually means the guild cannot use this AutoMod trigger or the bot permission grant is stale.'
      };
    }

    throw error;
  }
}

export async function setupAutoMod(guild) {
  const diagnostics = await getAutoModDiagnostics(guild);

  if (!diagnostics.hasManageGuild) {
    throw new Error(
      'Bot is missing Manage Server / Manage Guild in this server. Re-invite with the latest invite URL or grant it on the bot role.'
    );
  }

  const results = [];

  results.push(
    await applyRule(guild, {
      name: ruleName('Spam'),
      enabled: true,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Spam,
      actions: actions({
        message: 'ข้อความนี้ถูกบล็อกโดยระบบป้องกันสแปม'
      })
    })
  );

  results.push(
    await applyRule(guild, {
      name: ruleName('Mention Spam'),
      enabled: true,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.MentionSpam,
      triggerMetadata: {
        mentionTotalLimit: securityConfig.automodMentionLimit,
        mentionRaidProtectionEnabled: true
      },
      actions: actions({
        message: 'ข้อความนี้ mention มากเกินไป',
        timeout: true
      })
    })
  );

  results.push(
    await applyRule(guild, {
      name: ruleName('Harmful Keywords'),
      enabled: true,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Keyword,
      triggerMetadata: {
        keywordFilter: securityConfig.automodKeywordFilter,
        allowList: securityConfig.automodAllowList
      },
      actions: actions({
        message: 'ข้อความนี้ตรงกับคำหรือรูปแบบที่เสี่ยง',
        timeout: true
      })
    })
  );

  results.push(
    await applyRule(guild, {
      name: ruleName('Preset Filter'),
      enabled: true,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.KeywordPreset,
      triggerMetadata: {
        presets: [
          AutoModerationRuleKeywordPresetType.Profanity,
          AutoModerationRuleKeywordPresetType.SexualContent,
          AutoModerationRuleKeywordPresetType.Slurs
        ],
        allowList: securityConfig.automodAllowList
      },
      actions: actions({
        message: 'ข้อความนี้ถูกบล็อกโดยตัวกรองคำไม่เหมาะสม'
      })
    })
  );

  results.push(
    await applyRule(
      guild,
      {
        name: ruleName('Profile Impersonation'),
        enabled: true,
        eventType: AutoModerationRuleEventType.MemberUpdate,
        triggerType: AutoModerationRuleTriggerType.MemberProfile,
        triggerMetadata: {
          keywordFilter: securityConfig.automodProfileKeywords,
          allowList: securityConfig.automodAllowList
        },
        actions: actions({
          message: 'ชื่อหรือโปรไฟล์นี้ใช้คำที่อาจทำให้เข้าใจผิด'
        })
      },
      { optional: true }
    )
  );

  return {
    diagnostics,
    results
  };
}
