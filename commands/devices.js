const { CommandInteraction, Interaction } = require('discord.js')
const { sequelize, device } = require('../lib/models.js')
const { spawnSync } = require('child_process');
const MAX_DEVICES = parseInt(process.env.MAX_DEVICES)
const tmpdir = require('os').tmpdir()
const fs = require('fs')
const fetch = require('node-fetch')
const { save } = require('../lib/tss.js');
const random = require('../lib/random.js');
module.exports = {
    name: 'devices',
    subcommands: {
        add: {
            /**
             * 
             * @param { CommandInteraction } interaction 
             */
            async execute(interaction) {
                const owned_devices = await device.findAll({ where: { owner: interaction.user.id }, raw: true })
                if (owned_devices.length >= MAX_DEVICES) interaction.reply(`You have maxed out the number of your devices`)
                const ecid = interaction.options.getString('ecid')
                const existing_device = await device.findByPk(ecid, { raw: true })
                if (existing_device && existing_device.owner !== interaction.user.id) {
                    const owner = await interaction.client.users.fetch(existing_device.owner)
                    interaction.reply(`The device with this ECID is already registered under the Discord user ${owner.tag}!`)
                    return
                } else if (existing_device) {
                    interaction.reply('You already added this device.')
                    return
                }
                interaction.deferReply()
                const generator = interaction.options.getString('generator', false) || null
                const apnonce = interaction.options.getString('apnonce', false) || null
                const model = interaction.options.getString('model')
                const boardconfig = interaction.options.getString('boardconfig')
                await device.upsert({
                    model, ecid, generator, apnonce, boardconfig,
                    owner: interaction.user.id
                })
                let generators;
                if (!generator)
                    generators = ['0xbd34a880be0b53f3', '0x1111111111111111']
                else
                    generators = [`${generator.toString(16)}`]
                const signed_fw = await fetch('https://api.m1sta.xyz/betas/' + model, {
                    headers: { 'user-agent': 'Not-AutoTSS/0' }
                })
                    .then(response => response.json())
                    .then(json => json.filter(x => x.signed))
                for (gen of generators) {
                    const blobs = await Promise.all(signed_fw.map(fw => {
                        const filename = `${random()}.plist`
                        const manifest = `${tmpdir}/${filename}`
                        spawnSync(process.env.PZB_PATH, ['-g', 'BuildManifest.plist', '-o', manifest, fw.url], { pwd: require('os').tmpdir() })
                        const promise = save({ model, ecid, generator: gen, apnonce, boardconfig, buildid: fw.buildid, version: fw.version, manifest: filename })
                        fs.unlinkSync(filename)
                        return promise
                    }))
                    for (const blob of blobs) {
                        const blob_save_path = `./blobs/${ecid.toString(16)}/${blob.version}/${blob.buildid}${apnonce ? `/apnonce-${apnonce}` : ''}`
                        if (!fs.existsSync(blob_save_path)) fs.mkdirSync(blob_save_path, { recursive: true })
                        fs.writeFileSync(blob_save_path + '/' +blob.name, blob.ticket)
                        console.log(`Saved blob`)
                    }
                }
                interaction.followUp({ ephemeral: true, content: 'Device added and saved blobs.' })
            }
        }
    }
}
