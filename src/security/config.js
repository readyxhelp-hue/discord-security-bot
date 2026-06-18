const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseList = (value) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const securityConfig = {
  autoReactChannelId: process.env.AUTO_REACT_CHANNEL_ID || '1508019418733740122',
  autoReactEmoji: process.env.AUTO_REACT_EMOJI || '✅',
  logChannelId: process.env.SECURITY_LOG_CHANNEL_ID || null,
  timeoutSeconds: parseInteger(process.env.PROTECTION_TIMEOUT_SECONDS, 600),
  maxMessagesPer10Seconds: parseInteger(process.env.MAX_MESSAGES_PER_10_SECONDS, 6),
  maxDuplicateMessages: parseInteger(process.env.MAX_DUPLICATE_MESSAGES, 3),
  maxEmojisPerMessage: parseInteger(process.env.MAX_EMOJIS_PER_MESSAGE, 12),
  maxCapsPercent: parseInteger(process.env.MAX_CAPS_PERCENT, 75),
  minCapsLength: parseInteger(process.env.MIN_CAPS_LENGTH, 18),
  maxMentionsPerMessage: parseInteger(process.env.MAX_MENTIONS_PER_MESSAGE, 5),
  maxJoinAgeMinutes: parseInteger(process.env.MAX_JOIN_AGE_MINUTES, 1440),
  maxJoinsPer60Seconds: parseInteger(process.env.MAX_JOINS_PER_60_SECONDS, 8),
  freshAccountStrictMinutes: parseInteger(process.env.FRESH_ACCOUNT_STRICT_MINUTES, 60),
  freshAccountSpamMessages: parseInteger(process.env.FRESH_ACCOUNT_SPAM_MESSAGES, 3),
  blockInvites: parseBoolean(process.env.BLOCK_INVITES, true),
  blockLinks: parseBoolean(process.env.BLOCK_LINKS, false),
  blockLinkShorteners: parseBoolean(process.env.BLOCK_LINK_SHORTENERS, true),
  blockMassMentions: parseBoolean(process.env.BLOCK_MASS_MENTIONS, true),
  blockSuspiciousAttachments: parseBoolean(process.env.BLOCK_SUSPICIOUS_ATTACHMENTS, true),
  blockPhishingTerms: parseBoolean(process.env.BLOCK_PHISHING_TERMS, true),
  bannedWords: parseList(process.env.BANNED_WORDS).map((word) => word.toLowerCase()),
  allowedDomains: parseList(process.env.ALLOWED_DOMAINS).map((domain) => domain.toLowerCase()),
  linkShortenerDomains: parseList(
    process.env.LINK_SHORTENER_DOMAINS ||
      'bit.ly,tinyurl.com,t.co,goo.gl,is.gd,ow.ly,cutt.ly,rebrand.ly,shorturl.at'
  ).map((domain) => domain.toLowerCase()),
  phishingTerms: parseList(
    process.env.PHISHING_TERMS ||
      'free nitro,steam gift,airdrop,claim reward,discord staff,discord mod,verify wallet,connect wallet'
  ).map((term) => term.toLowerCase()),
  automodPrefix: process.env.AUTOMOD_RULE_PREFIX || 'Byte Guard',
  automodKeywordFilter: parseList(
    process.env.AUTOMOD_KEYWORDS ||
      '*discord.gg/*,*discord.com/invite/*,*discordapp.com/invite/*,*free nitro*,*steam gift*,*claim reward*,*verify wallet*,*connect wallet*'
  ),
  automodProfileKeywords: parseList(
    process.env.AUTOMOD_PROFILE_KEYWORDS || '*admin*,*moderator*,*support*,*discord staff*,*ticket*'
  ),
  automodAllowList: parseList(process.env.AUTOMOD_ALLOW_LIST),
  automodMentionLimit: parseInteger(process.env.AUTOMOD_MENTION_LIMIT, 5),
  automodTimeoutSeconds: parseInteger(process.env.AUTOMOD_TIMEOUT_SECONDS, 600)
};
