#!/usr/bin/env node
require('dotenv').config()
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { BOT_TOKEN, CLIENT_ID } = process.env

const commands = [
	new SlashCommandBuilder()
		.setName('devices')
		.setDescription('Modify your device list')
		.addSubcommand(subcommand => {
			return subcommand
				.setName('add')
				.setDescription('Add a device')
				.addStringOption(option => {
					return option
						.setName('name')
						.setDescription('Custom device name')
						.setRequired(true)
				})
				.addStringOption(option => {
					return option
						.setName('model')
						.setDescription('Device model in DeviceTypeX,Y format')
						.setRequired(true)
				})
				.addStringOption(option => {
					return option
						.setName('ecid')
						.setDescription('Device ECID')
						.setRequired(true)
				})
				.addStringOption(option => {
					return option
						.setName('boardconfig')
						.setDescription('Board Configuration')
						.setRequired(true)
				})
				.addStringOption(option => {
					return option
						.setName('generator')
						.setDescription('Device Generator')
						.setRequired(false)
				})
				.addStringOption(option => {
					return option
						.setName('apnonce')
						.setDescription('Device APNonce. This MUST match the generator.')
						.setRequired(false)
				})
		})
		.addSubcommand(subcommand => {
			return subcommand
				.setName('list')
				.setDescription('List your devices')
		})
		.addSubcommand(subcommand => {
			return subcommand
				.setName('remove')
				.setDescription('Remove a devices')
				.addStringOption(option => {
					return option
						.setName('name')
						.setDescription('Remove a device')
						.setRequired(true)
				})
		}),
	new SlashCommandBuilder()
		.setName('tss')
		.setDescription('Controls the TSS Saver')
		.addSubcommand(subcommand => {
			return subcommand
				.setName('save')
				.setDescription('Save blobs for all your devices')
		})
		.addSubcommand(subcommand => {
			return subcommand
				.setName('download')
				.setDescription('Download your blobs for all your devices.')
		})
		.addSubcommand(subcommand => {
			return subcommand
				.setName('list')
				.setDescription('List SHSH blobs saved for all your devices.')
		}),
	new SlashCommandBuilder()
		.setName('misc')
		.setDescription('Print miscellaneous information')
		.addSubcommand(subcommand => {
			return subcommand
				.setName('ping')
				.setDescription('Returns interation latency')
		}),
	new SlashCommandBuilder().setName('dev').setDescription('Bot developer only stuff'),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(BOT_TOKEN);

(async () => {
	try {
		await rest.put(
			Routes.applicationCommands(CLIENT_ID,/*'588354390239346709'*/),
			{ body: commands },
		);

		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();
