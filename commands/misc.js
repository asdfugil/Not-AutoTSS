const { CommandInteraction } = require('discord.js')
module.exports = {
    'name': 'misc',
    subcommands: {
        ping: {
                /**
     * 
     * @param { CommandInteraction } interation 
     */
            execute(interation) {
                interation.reply(`Pong! \`${interation.client.ws.ping}ms\``)
            }
        }
    },
}