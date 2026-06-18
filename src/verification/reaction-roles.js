import { Events } from 'discord.js';
import { getVerificationConfig } from './store.js';

function emojiMatches(reaction, expectedEmoji) {
  return reaction.emoji.id === expectedEmoji || reaction.emoji.name === expectedEmoji || reaction.emoji.toString() === expectedEmoji;
}

async function resolveReaction(reaction) {
  if (reaction.partial) {
    try {
      return await reaction.fetch();
    } catch {
      return null;
    }
  }

  return reaction;
}

async function resolveUser(user) {
  if (user.partial) {
    try {
      return await user.fetch();
    } catch {
      return null;
    }
  }

  return user;
}

async function updateVerifiedRole(reaction, user, shouldAdd) {
  const fullReaction = await resolveReaction(reaction);
  const fullUser = await resolveUser(user);

  if (!fullReaction || !fullUser || fullUser.bot) return;

  const config = await getVerificationConfig();
  if (!config.enabled) return;
  if (fullReaction.message.guildId !== config.guildId) return;
  if (fullReaction.message.channelId !== config.channelId) return;
  if (fullReaction.message.id !== config.messageId) return;
  if (!emojiMatches(fullReaction, config.emoji)) return;

  const guild = fullReaction.message.guild;
  const member = await guild.members.fetch(fullUser.id);
  const role = await guild.roles.fetch(config.roleId);

  if (!role) {
    console.warn(`Verification role ${config.roleId} was not found.`);
    return;
  }

  if (shouldAdd) {
    await member.roles.add(role, 'Verification reaction role');
  } else if (config.removeRoleOnUnreact) {
    await member.roles.remove(role, 'Verification reaction removed');
  }
}

export function registerReactionRoles(client) {
  client.on(Events.MessageReactionAdd, (reaction, user) => {
    updateVerifiedRole(reaction, user, true).catch((error) => {
      console.warn('Could not apply verification role:', error.message);
    });
  });

  client.on(Events.MessageReactionRemove, (reaction, user) => {
    updateVerifiedRole(reaction, user, false).catch((error) => {
      console.warn('Could not remove verification role:', error.message);
    });
  });
}
