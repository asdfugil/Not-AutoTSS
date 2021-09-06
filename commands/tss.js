const { CommandInteraction, MessageAttachment, MessageEmbed } = require('discord.js');
const { device } = require('../lib/models.js');
const { existsSync } = require('fs')
const JSZip = require('jszip');
const fs = require('fs')
const fetch = require('node-fetch');
module.exports = {
	name: 'tss',
	subcommands: {
		download: {
			/**
			*
			* @param { CommandInteraction } intercation
			*/
			async execute(interaction) {
				await interaction.deferReply()
				const name = interaction.options.getString('name')
				const devices = await device.findAll({ where: { owner: interaction.user.id }, raw: true })
				if (!devices?.[0]) return interaction.followUp(`There are no devices`)
				let zip = new JSZip()
				for (const dev of devices) {
					const device_dir = './blobs/' + dev.ecid
					if (!existsSync(device_dir)) continue
					zip = zip
						.folder(device_dir)
					for (const version of fs.readdirSync(device_dir)) {
						const version_dir = device_dir + '/' + version
						zip.folder(version_dir)
						for (const build_id of fs.readdirSync(version_dir)) {
							const build_id_dir = version_dir + '/' + build_id
							zip.folder(build_id_dir)
							for (const blob of fs.readdirSync(build_id_dir)) {
								const blob_file = build_id_dir + '/' + blob
								zip.file(blob_file,fs.readFileSync(blob_file,'utf8'));
							}
						}
					}

					console.log(dev.ecid)
				}
				const msg = await interaction.client.attachment_channel.send({
					files: [new MessageAttachment(await zip.generateAsync({type:'nodebuffer'}),'blobs.zip')]
				})
				console.log(msg.attachments.first().url)
				interaction.followUp({
					embeds: [new MessageEmbed().setDescription(msg.attachments.first().url)],
					ephemeral: true
				})
			}
		}
	}
}
