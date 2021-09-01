#!/usr/bin/env node
require('dotenv').config()
const Discord = require('discord.js')
const fs = require('fs')
const { sequelize } = require('./lib/models.js')
if (!fs.existsSync('./blobs')) fs.mkdirSync('./blobs')
class NotAutoTSSClient extends Discord.Client {
	/**
	 * NotAutoTSS Client
	 * @param { Discord.ClientOptions } options 
	 */
	constructor(options) {
		super(options)
		this.commands = new Discord.Collection()
	}
}
const client = new NotAutoTSSClient({
	intents: []
})
for (const commandFile of fs.readdirSync('./commands')) {
	const command = require('./commands/' + commandFile)
	client.commands.set(command.name, command)
}
client.once('ready', () => {
	console.log('Ready!');
});
client.on('interactionCreate', async interation => {
	if (!interation.isCommand()) return
	try {
		if (interation.options.getSubcommand(false))
			await client.commands.get(interation.commandName).subcommands[interation.options.getSubcommand()].execute(interation)
		else
			await client.commands.get(interation.commandName).execute(interation)
	} catch (error) {
		console.error(`Error occured in command ` + interation.commandName + ':\n' + error.stack)
	}
})
client.login(process.env.BOT_TOKEN)
