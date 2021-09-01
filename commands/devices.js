const { CommandInteraction, Interaction } = require('discord.js')
const { sequelize, device } = require('../lib/models.js')
const { spawnSync } = require('child_process');
const MAX_DEVICES = parseInt(process.env.MAX_DEVICES)
const tmpdir = require('os').tmpdir()
const fs = require('fs')
const { store } = require('../lib/tss.js');
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
                const generator = interaction.options.getString('generator', false) || null
                const apnonce = interaction.options.getString('apnonce', false) || null
                const model = interaction.options.getString('model')
                const boardconfig = interaction.options.getString('boardconfig')
                await device.upsert({
                    model, ecid, generator, apnonce, boardconfig,
                    owner: interaction.user.id
                })
                store(generator,ecid,apnonce,boardconfig,model) 
                interaction.reply({ ephemeral: true, content: 'Device added and saving blobs.' })
            }
        }
    }
}
