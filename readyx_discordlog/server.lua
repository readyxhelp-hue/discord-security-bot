local RESOURCE = GetCurrentResourceName()
local lastWebhookSend = {}
local playerRateLimit = {}

local function debugPrint(message)
    if Config.Security.debug then
        print(message)
    end
end

local function nowMs()
    return GetGameTimer()
end

local function isString(value)
    return type(value) == "string" and value ~= ""
end

local function sanitizeText(value, fallback, maxLength)
    if not isString(value) then
        return fallback or ""
    end

    value = value:gsub("@everyone", "@\226\128\139everyone")
    value = value:gsub("@here", "@\226\128\139here")

    if maxLength and #value > maxLength then
        value = value:sub(1, maxLength - 3) .. "..."
    end

    return value
end

local function sanitizeFields(fields)
    if type(fields) ~= "table" then
        return {}
    end

    local clean = {}

    for _, field in ipairs(fields) do
        if type(field) == "table" and isString(field.name) and field.value ~= nil then
            clean[#clean + 1] = {
                name = sanitizeText(field.name, "Field", 256),
                value = sanitizeText(tostring(field.value), "-", 1024),
                inline = field.inline == true
            }
        end

        if #clean >= 25 then
            break
        end
    end

    return clean
end

local function getWebhookConfig(webhookName)
    if not isString(webhookName) then
        return nil
    end

    return Config.Log[webhookName]
end

local function isWebhookReady(webhookName, logConfig)
    if not logConfig then
        print(Config.Messages.missingWebhook:format(tostring(webhookName)))
        return false
    end

    if not isString(logConfig.webhook) or logConfig.webhook == "WEBHOOK_URL_HERE" then
        print(Config.Messages.invalidWebhook:format(webhookName))
        return false
    end

    return true
end

local function isWebhookOnCooldown(webhookName)
    local cooldown = Config.Security.webhookCooldownMs or 0
    if cooldown <= 0 then
        return false
    end

    local lastSend = lastWebhookSend[webhookName] or 0
    local currentTime = nowMs()

    if currentTime - lastSend < cooldown then
        debugPrint(Config.Messages.cooldown:format(webhookName))
        return true
    end

    lastWebhookSend[webhookName] = currentTime
    return false
end

local function sendDiscordLog(webhookName, title, message, fields)
    local logConfig = getWebhookConfig(webhookName)

    if not isWebhookReady(webhookName, logConfig) then
        return false
    end

    if isWebhookOnCooldown(webhookName) then
        return false
    end

    local embed = {
        title = sanitizeText(title, "ReadyX Log", 256),
        description = sanitizeText(message, "", 4096),
        color = tonumber(logConfig.color) or 3447003,
        fields = sanitizeFields(fields),
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        footer = {
            text = sanitizeText(logConfig.footer, "ReadyX Logs", 2048)
        }
    }

    local payload = {
        username = sanitizeText(logConfig.name, "ReadyX Log", 80),
        embeds = { embed }
    }

    if isString(logConfig.avatar) then
        payload.avatar_url = sanitizeText(logConfig.avatar, "", 512)
    end

    PerformHttpRequest(logConfig.webhook, function(statusCode, response)
        if statusCode < 200 or statusCode >= 300 then
            print(("[readyx_discordlog] Discord webhook failed (%s): %s"):format(statusCode, response or ""))
        end
    end, "POST", json.encode(payload), {
        ["Content-Type"] = "application/json"
    })

    return true
end

exports("readyx", function(webhookName, title, message, fields)
    if source and source ~= 0 then
        print(("[readyx_discordlog] Blocked export call from invalid source: %s"):format(source))
        return false
    end

    return sendDiscordLog(webhookName, title, message, fields)
end)

RegisterNetEvent("readyx_discordlog:serverLog", function(secret, webhookName, title, message, fields)
    local src = source

    if secret ~= Config.Security.eventSecret then
        print(Config.Messages.badSecret)
        return
    end

    if src and src ~= 0 then
        print(Config.Messages.clientBlocked:format(src))
        return
    end

    sendDiscordLog(webhookName, title, message, fields)
end)

RegisterNetEvent("readyx_discordlog:clientReport", function(title, message)
    local src = source
    if not src or src <= 0 then
        return
    end

    local currentTime = nowMs()
    local lastSend = playerRateLimit[src] or 0
    local limit = Config.Security.playerRateLimitMs or 5000

    if currentTime - lastSend < limit then
        return
    end

    playerRateLimit[src] = currentTime

    local playerName = GetPlayerName(src) or "Unknown"
    sendDiscordLog("webhookdiscord", "Client Report", sanitizeText(message, "No message", 1024), {
        { name = "Player", value = playerName, inline = true },
        { name = "Source", value = tostring(src), inline = true },
        { name = "Title", value = sanitizeText(title, "Client Report", 256), inline = false }
    })
end)

AddEventHandler("playerConnecting", function(playerName)
    local src = source
    sendDiscordLog("webhookdiscord", "Player Connecting", "ผู้เล่นกำลังเข้าเซิร์ฟเวอร์", {
        { name = "Player", value = playerName or "Unknown", inline = true },
        { name = "Source", value = tostring(src), inline = true }
    })
end)

AddEventHandler("playerDropped", function(reason)
    local src = source
    local playerName = GetPlayerName(src) or "Unknown"

    sendDiscordLog("webhookdiscord", "Player Dropped", "ผู้เล่นออกจากเซิร์ฟเวอร์", {
        { name = "Player", value = playerName, inline = true },
        { name = "Source", value = tostring(src), inline = true },
        { name = "Reason", value = reason or "Unknown", inline = false }
    })

    playerRateLimit[src] = nil
end)

print(("[%s] ReadyX Discord Log loaded. Webhooks are server-side only."):format(RESOURCE))
