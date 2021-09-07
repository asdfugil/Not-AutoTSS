const { CommandInteraction } = require('discord.js')
module.exports = {
    'name': 'misc',
    subcommands: {
        ping: {
                /**
     * 
     * @param { CommandInteraction } interaction 
     */
            async execute(interaction) {
		const now = Date.now()
		const msg = await interaction.reply("Pinging...");
                interaction.editReply(`Pong! \nMessage round trip: \`${Date.now() - now}ms\`\nWebsocket ping: \`${interaction.client.ws.ping}ms\``)
            }
        }
    },
}
