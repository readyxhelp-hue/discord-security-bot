import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeJson } from '../storage/json-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../../data/verification.json');

export async function getVerificationConfig() {
  return readJson(configPath, {
    enabled: false,
    guildId: null,
    channelId: null,
    messageId: null,
    roleId: null,
    emoji: '✅',
    removeRoleOnUnreact: false
  });
}

export async function saveVerificationConfig(config) {
  await writeJson(configPath, config);
}
