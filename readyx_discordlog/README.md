# readyx_discordlog

Standalone FiveM resource สำหรับส่ง Discord Webhook Log แบบ server-side เท่านั้น

## Features

- ไม่พึ่ง ESX/QBCore
- ส่ง Discord embed ได้
- รองรับ `title`, `message`, `fields`
- ตั้งค่า webhook ได้หลายชุดใน `config.lua`
- รองรับ `color`, `footer`, `avatar`, `name` จาก config
- มี timestamp อัตโนมัติ
- มี cooldown กัน spam webhook
- มี rate limit ต่อ player/source สำหรับ event ที่รับจาก client
- มี exports สำหรับ resource อื่น
- มีตัวอย่าง log `playerConnecting` และ `playerDropped`
- ไม่ส่ง webhook ไป client
- ไม่มี `client.lua` เพื่อป้องกัน webhook หลุด
- เตรียมโครงสำหรับ FiveM Asset Escrow ด้วย `escrow_ignore` ให้ลูกค้าแก้ `config.lua`

## Files

```text
readyx_discordlog/
  fxmanifest.lua
  config.lua
  server.lua
  README.md
```

## Install

1. วางโฟลเดอร์ `readyx_discordlog` ใน `resources`
2. แก้ `config.lua`
3. ใส่ Discord webhook URL จริงใน `Config.Log`
4. เพิ่มใน `server.cfg`

```cfg
ensure readyx_discordlog
```

## Config

```lua
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
```

## Export Usage

ใช้จาก resource อื่นแบบ server-side:

```lua
exports["readyx_discordlog"]:readyx("webhookdiscord", "Player Joined", "ผู้เล่นเข้าเซิร์ฟเวอร์", {
    { name = "Player", value = "ReadyX", inline = true },
    { name = "ID", value = "1", inline = true }
})
```

ส่ง admin log:

```lua
exports["readyx_discordlog"]:readyx("admin", "Admin Action", "มีการใช้คำสั่งแอดมิน", {
    { name = "Admin", value = "ReadyX", inline = true },
    { name = "Action", value = "revive", inline = true }
})
```

## Internal Server Event

มี event server-side พร้อม secret สำหรับใช้ภายใน:

```lua
TriggerEvent("readyx_discordlog:serverLog", Config.Security.eventSecret, "admin", "Server Event", "ข้อความจาก server event", {
    { name = "Resource", value = GetCurrentResourceName(), inline = true }
})
```

ห้ามส่ง `Config.Security.eventSecret` ไป client เด็ดขาด

## Client Report Event

มี event รับจาก client แบบจำกัดมากสำหรับ report เท่านั้น:

```lua
TriggerServerEvent("readyx_discordlog:clientReport", "Report Title", "Report message")
```

ข้อจำกัด:

- Client เลือก webhook เองไม่ได้
- ระบบบังคับส่งเข้า `webhookdiscord`
- มี rate limit ต่อ player/source
- sanitize ข้อความก่อนส่ง Discord

## Security Notes

- Webhook URL อยู่เฉพาะ `config.lua` และโหลดฝั่ง server เท่านั้น
- ไม่มี `client.lua`
- ห้ามใช้ `TriggerClientEvent` เพื่อส่ง webhook
- Export `readyx` ออกแบบให้ใช้จาก server-side resources
- Event ภายในใช้ secret key
- Event จาก client validate ข้อมูลและ rate limit
- ข้อความถูก sanitize เพื่อกัน `@everyone` และ `@here`

สำหรับ release เชิงพาณิชย์ แนะนำ:

- ใช้ FiveM Asset Escrow / FXAP
- `server.lua` เป็น escrowed core logic
- `config.lua` และ `README.md` ถูกใส่ไว้ใน `escrow_ignore`
- ใช้ obfuscation เพิ่มเติมถ้าต้องการกันแกะขั้นสูง

## Troubleshooting

### Webhook config not found

เช็กว่า `webhookName` ที่ส่งมา ตรงกับ key ใน `Config.Log`

```lua
exports["readyx_discordlog"]:readyx("webhookdiscord", "Title", "Message")
```

### Invalid webhook URL

เปลี่ยน `WEBHOOK_URL_HERE` เป็น webhook URL จริงจาก Discord

### Log ไม่เข้า Discord

เช็ก:

- resource ถูก `ensure` แล้ว
- webhook URL ถูกต้อง
- Discord channel ยังมี webhook อยู่
- server console ไม่มี error จาก Discord webhook

## License

ReadyX
