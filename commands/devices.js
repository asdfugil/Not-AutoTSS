const { CommandInteraction, MessageEmbed } = require('discord.js')
const { sequelize, device } = require('../lib/models.js')
const { spawnSync } = require('child_process');
const MAX_DEVICES = parseInt(process.env.MAX_DEVICES)
const tmpdir = require('os').tmpdir()
const fs = require('fs')
const { store } = require('../lib/tss.js');
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
                const generator = interaction.options.getString('generator', false) || null
                const apnonce = interaction.options.getString('apnonce', false) || null
                const model = interaction.options.getString('model')
                const boardconfig = interaction.options.getString('boardconfig')
                await device.upsert({
                    model, ecid, generator, apnonce, boardconfig,
                    name: interaction.options.getString('name'),
                    owner: interaction.user.id
                })
                store(generator, ecid, apnonce, boardconfig, model)
                interaction.reply({ ephemeral: true, content: 'Device added and saving blobs.' })
            }
        },
        list: {
            /**
             * 
             * @param { CommandInteraction } interaction 
             */
            async execute(interaction) {
                const owned_devices = await device.findAll({ where: { owner: interaction.user.id }, raw: true })
                if (owned_devices.length === 0) return interaction.reply(`You didn\'t have any device added to Not-AutoTSS. Add at least one device and try again.`)
                const embed = new MessageEmbed()
                    .setTitle(interaction.user.tag + "'s devices")
                    .setColor(0xffffff)
                    .setTimestamp()
                for (const device of owned_devices) {
                    let blobs_count = 0
                    // speed up
                    const blobs_count_array = await Promise.all(fs.readdirSync(`./blobs/${device.ecid}`).map(async version => {
                        const buildids = await fs.promises.readdir(`./blobs/${device.ecid}/${version}`)
                        return buildids.length
                    }))
                    for (const count of blobs_count_array) {
                        blobs_count += count
                    }

                    let device_string = `Name: ${device.name}
Model: ${device.model}
ECID: ||${device.ecid}||
Blobs count: ${blobs_count}
Generator(s): \`${device.generator || '0xbd34a880be0b53f3, 0x1111111111111111'}\`
APNonce: ${device.apnonce || 'None'}
`
                    embed.addField(device.name, device_string)
                }
                interaction.reply({ embeds: [embed], ephemeral: true })
            }
        },
        remove: {
            /**
            * 
            * @param { CommandInteraction } interaction 
            */
            async execute(interaction) {
                const die = await device.findOne({ where: { owner: interaction.user.id, name: interaction.options.getString('name') }, raw: true })
                const count = await device.destroy({ where: { owner: interaction.user.id, name: interaction.options.getString('name') } })
                if (count === 0) return interaction.reply('Incoorect device name')
                else {
                    if (fs.existsSync(`./blobs/${die.ecid}`)) fs.rmSync(`./blobs/${die.ecid}`, { recursive: true })
                    interaction.reply('Device removed')
                }
            }
        }
    }
}
