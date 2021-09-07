const { CommandInteraction, MessageAttachment, MessageEmbed } = require('discord.js');
const { device } = require('../lib/models.js');
const { existsSync } = require('fs')
const JSZip = require('jszip');
const fs = require('fs')
const fetch = require('node-fetch');
const { exec } = require('child_process')
module.exports = {
	name: 'tss',
	subcommands: {
		download: {
			/**
			*
			* @param { CommandInteraction } intercation
			*/
			async execute(interaction) {
				await interaction.deferReply({ ephemeral: true })
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

				}
				const { stdin } = exec(`${process.env.CURL_PATH} -o- -F 'files[]=@-;filename=shsh_blobs.zip' -A Not-AutoTSS/0 -X POST https://tmp.ninja/upload.php`,{},function(error,stdout,stderr) {
					const info = JSON.parse(stdout.toString('utf8'))
					if (info.success === false) interaction.followUp(`Unable to upload blobs: ${info.message}`)
					const embed = new MessageEmbed()
						.setColor('#660000')
						.setTitle('Download blobs')
						.setDescription(`[Click here](${info.files[0].url}) (${info.files[0].size/1048576} MB)\n\nThis link is valid for 48 hours.`)
					interaction.followUp({ embeds: [ embed ], ephemeral: true })
				})
				zip.generateNodeStream({ type: 'nodebuffer' }).pipe(stdin);
			}
		}
	}
}
