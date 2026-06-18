fx_version 'cerulean'
game 'gta5'

author 'ReadyX'
description 'Standalone Discord webhook logger for FiveM'
version '1.0.0'

lua54 'yes'
server_only 'yes'

server_scripts {
    'config.lua',
    'server.lua'
}

escrow_ignore {
    'config.lua',
    'README.md'
}
