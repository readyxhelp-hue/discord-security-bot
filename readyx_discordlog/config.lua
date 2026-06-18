Config = {}

Config.Log = {
    ["webhookdiscord"] = {
        name = "ReadyX Log",
        webhook = "WEBHOOK_URL_HERE",
        color = 3447003,
        avatar = "",
        footer = "ReadyX Logs"
    },

    ["admin"] = {
        name = "Admin Log",
        webhook = "WEBHOOK_URL_HERE",
        color = 15158332,
        avatar = "",
        footer = "ReadyX Admin"
    }
}

Config.Security = {
    -- ใช้สำหรับ internal server event เท่านั้น ห้ามส่งค่านี้ไป client
    eventSecret = "CHANGE_ME_INTERNAL_SECRET",

    -- cooldown ต่อ webhookName สำหรับ exports/server-side log
    webhookCooldownMs = 750,

    -- rate limit ต่อ player/source สำหรับ event ที่รับจาก client
    playerRateLimitMs = 5000,

    -- ถ้าเปิด true จะ print รายละเอียด error/debug มากขึ้น
    debug = false
}

Config.Messages = {
    missingWebhook = "[readyx_discordlog] Webhook config not found: %s",
    invalidWebhook = "[readyx_discordlog] Invalid webhook URL for: %s",
    cooldown = "[readyx_discordlog] Cooldown active for webhook: %s",
    badSecret = "[readyx_discordlog] Blocked event with invalid secret.",
    clientBlocked = "[readyx_discordlog] Blocked unsafe client log attempt from source: %s"
}
