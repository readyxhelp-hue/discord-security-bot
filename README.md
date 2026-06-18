# Byte Discord Security Bot

บอท Discord สำหรับ server `Byte's` ที่รวมระบบยืนยันตัวตน, แจก role ด้วย reaction, ป้องกันสแปม/raid, ตั้งค่า Discord AutoMod และเครื่องมือช่วยดูข้อมูล server

## สถานะปัจจุบัน

- Bot runtime ใช้งานได้: logged in as `WHAT#8644`
- Slash commands deploy แล้ว 4 commands
- Protection และ auto-react handlers active
- Discord AutoMod rules หลักตั้งค่าสำเร็จแล้ว 4 rules
- Optional rule `Byte Guard: Profile Impersonation` ถูกข้าม เพราะ Discord API ตอบ `Missing Access` เฉพาะ trigger type นี้

## ความสามารถ

### Verification

- สร้าง verify panel แบบ embed ทางการ
- สมาชิกกด reaction `✅` แล้วได้รับ role อัตโนมัติ
- จำ verify message หลัง restart ผ่าน `data/verification.json`
- มีคำสั่งดูสถานะและปิดระบบ verify

ค่า preset ของ server นี้:

- Channel: `〔❤️‍🔥〕𝗩𝗲𝗿𝗶𝗳𝘆` (`1508019418733740122`)
- Role หลังยืนยัน: `CL` (`1508019020476055722`)
- Emoji: `✅`
- Panel style: official security gate embed

### Bot Protection

บอทตรวจข้อความและสมาชิกใหม่แบบ realtime:

- ลบ Discord invite links
- จับ invite links แบบพยายามหลบ filter ด้วย zero-width หรือ spacing บางส่วน
- กัน message spam
- กันข้อความซ้ำ
- กัน mass mentions
- กัน emoji flood
- กัน CAPS flood
- กัน link shorteners เช่น `bit.ly`, `tinyurl.com`, `t.co`
- กัน phishing phrases เช่น `free nitro`, `steam gift`, `claim reward`, `verify wallet`
- กันไฟล์แนบเสี่ยง เช่น `.exe`, `.bat`, `.cmd`, `.js`, `.ps1`
- timeout สมาชิกที่ละเมิดชั่วคราว
- ตรวจบัญชีใหม่มาก
- ตรวจ fresh-account burst
- ตรวจ join spike / raid signal
- ข้ามผู้ดูแลที่มี `Manage Messages` หรือ `Administrator`

### Discord AutoMod

ตั้งค่า AutoMod rules หลักสำเร็จแล้ว:

- `Byte Guard: Spam`
- `Byte Guard: Mention Spam`
- `Byte Guard: Harmful Keywords`
- `Byte Guard: Preset Filter`

AutoMod ช่วยบล็อกข้อความก่อนถูกโพสต์ เช่น spam, mention spam, invite/phishing keywords และคำไม่เหมาะสมจาก preset ของ Discord

Optional rule ที่ถูกข้าม:

- `Byte Guard: Profile Impersonation`

เหตุผล: Discord API ตอบ `Missing Access` เฉพาะ `MemberProfile` trigger type ใน guild นี้ ไม่กระทบระบบหลัก

### Server Tools

- `/server-scan` ดึงรายการ channels และ roles พร้อม ID
- แสดงผลแบบ ephemeral เฉพาะคนสั่งเห็น
- ใช้ช่วยตั้งค่า verify/security โดยไม่ต้องหา ID เอง

## Slash Commands

```text
/ping
/server-scan
/security status
/security automod
/verify setup
/verify status
/verify disable
```

## Scripts

```bash
npm install
npm run invite
npm run deploy:commands
npm run setup:verify
npm run setup:automod
npm start
```

คำอธิบาย:

- `npm run invite` สร้าง invite URL พร้อม permissions ที่ต้องใช้
- `npm run deploy:commands` deploy slash commands เข้า guild
- `npm run setup:verify` สร้าง verify panel ตาม preset
- `npm run setup:automod` สร้างหรืออัปเดต Discord AutoMod rules
- `npm start` เปิดบอท

## การติดตั้ง

1. เปิด [Discord Developer Portal](https://discord.com/developers/applications)
2. เลือก application ของบอท
3. ไปที่ **Bot** แล้ว reset/copy Bot Token
4. เปิด **Privileged Gateway Intents**
5. สร้างไฟล์ `.env` จาก `.env.example`
6. ใส่ token ใน `.env` บนเครื่องเท่านั้น ห้ามแปะ token ในแชต

Intents ที่ต้องเปิด:

- Server Members Intent
- Message Content Intent

## Invite Permissions

บอทต้องมี permissions:

- View Channel
- Send Messages
- Read Message History
- Add Reactions
- Manage Messages
- Moderate Members
- Manage Roles
- Manage Server
- Use Slash Commands

สร้าง invite URL:

```bash
npm run invite
```

## Environment

ค่าหลัก:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=1510251436124934325
DISCORD_GUILD_ID=1508006788312862791
```

Verification:

```env
AUTO_REACT_CHANNEL_ID=1508019418733740122
AUTO_REACT_EMOJI=✅
VERIFY_CHANNEL_ID=1508019418733740122
VERIFY_ROLE_ID=1508019020476055722
VERIFY_EMOJI=✅
VERIFY_TITLE=Access Verification
VERIFY_DESCRIPTION=กรุณายืนยันตัวตนก่อนเข้าใช้งานพื้นที่หลักของเซิร์ฟเวอร์ เพื่อช่วยรักษาความปลอดภัยและคุณภาพของชุมชน
VERIFY_REMOVE_ON_UNREACT=false
```

Protection:

```env
SECURITY_LOG_CHANNEL_ID=
PROTECTION_TIMEOUT_SECONDS=600
MAX_MESSAGES_PER_10_SECONDS=6
MAX_DUPLICATE_MESSAGES=3
MAX_EMOJIS_PER_MESSAGE=12
MAX_CAPS_PERCENT=75
MIN_CAPS_LENGTH=18
MAX_MENTIONS_PER_MESSAGE=5
MAX_JOIN_AGE_MINUTES=1440
MAX_JOINS_PER_60_SECONDS=8
FRESH_ACCOUNT_STRICT_MINUTES=60
FRESH_ACCOUNT_SPAM_MESSAGES=3
BLOCK_INVITES=true
BLOCK_LINKS=false
BLOCK_LINK_SHORTENERS=true
BLOCK_MASS_MENTIONS=true
BLOCK_SUSPICIOUS_ATTACHMENTS=true
BLOCK_PHISHING_TERMS=true
BANNED_WORDS=
ALLOWED_DOMAINS=
```

AutoMod:

```env
AUTOMOD_RULE_PREFIX=Byte Guard
AUTOMOD_KEYWORDS=*discord.gg/*,*discord.com/invite/*,*discordapp.com/invite/*,*free nitro*,*steam gift*,*claim reward*,*verify wallet*,*connect wallet*
AUTOMOD_PROFILE_KEYWORDS=*admin*,*moderator*,*support*,*discord staff*,*ticket*
AUTOMOD_ALLOW_LIST=
AUTOMOD_MENTION_LIMIT=5
AUTOMOD_TIMEOUT_SECONDS=600
```

แนะนำให้ตั้ง `SECURITY_LOG_CHANNEL_ID` เป็นช่อง private สำหรับทีมงาน เพื่อให้ Discord AutoMod และบอทส่ง log ได้ครบ

## ใช้งานจริง

ครั้งแรก:

```bash
npm install
npm run invite
npm run deploy:commands
npm run setup:automod
npm run setup:verify
npm start
```

หลังจากนั้นเปิดบอทตามปกติ:

```bash
npm start
```

## ข้อควรระวัง

- Role ของบอทต้องอยู่สูงกว่า role `CL` ไม่งั้นแจก role ไม่ได้
- ถ้าใช้ custom emoji บอทต้องเข้าถึง emoji นั้นได้
- ถ้า `TokenInvalid` ให้ reset Bot Token แล้วใส่ token ใหม่ใน `.env`
- ถ้า AutoMod optional `Profile Impersonation` ถูก skip ถือว่าปกติใน server นี้
- Slash commands ใช้ได้แม้ AutoMod บาง rule ถูกข้าม

## Troubleshooting

### 401 Unauthorized หรือ TokenInvalid

Token ใน `.env` ไม่ถูกต้อง ให้ reset Bot Token ใน Developer Portal แล้วใส่ใหม่

### AutoMod Missing Access 50001

ให้เช็กว่า invite ด้วย permission ล่าสุดแล้ว และบอทมี `Manage Server`

สำหรับ server นี้ permission หลักครบแล้ว แต่ Discord ไม่ให้สร้าง `MemberProfile` trigger จึงข้ามเฉพาะ `Profile Impersonation`

### บอทแจก role ไม่ได้

เช็กใน Server Settings > Roles:

- บอทมี `Manage Roles`
- role ของบอทอยู่สูงกว่า `CL`
- role `CL` ไม่ได้อยู่สูงกว่าบอท

### Verify panel เก่าไม่เปลี่ยนหน้าตา

สร้าง panel ใหม่:

```bash
npm run setup:verify
```

แล้วลบ panel เก่าใน Discord

## โครงสร้างไฟล์สำคัญ

```text
src/index.js
src/deploy-commands.js
src/setup-verification.js
src/setup-automod.js
src/commands/ping.js
src/commands/security.js
src/commands/server-scan.js
src/commands/verify.js
src/security/config.js
src/security/protection.js
src/security/automod.js
src/security/log.js
src/verification/reaction-roles.js
src/verification/setup-panel.js
src/verification/store.js
src/storage/json-store.js
```

## เพิ่มคำสั่งใหม่

สร้างไฟล์ใหม่ใน `src/commands` แล้ว export `data` และ `execute` เหมือน commands อื่น จากนั้น deploy ใหม่:

```bash
npm run deploy:commands
```
