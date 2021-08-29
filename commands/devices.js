const { CommandInteraction, Interaction } = require('discord.js')
const { sequelize, device } = require('../lib/models.js')
const { save } = require('../lib/tss.js')
module.exports = {
    name: 'devices',
    subcommands: {
        add: {
            /**
             * 
             * @param { CommandInteraction } interaction 
             */
            async execute(interaction) {
                const owned_devices = await device.findAll({ where: { owner: BigInt(interaction.user.id) } })
                const ecid = interaction.options.getString('ecid')
                const existing_device = await device.findByPk(BigInt(ecid), { raw: true })
                if (existing_device) {
                    const owner = await interaction.client.users.fetch(existing_device.owner)
                    interaction.reply(`The device with this ECID is already registered under the Discord user ${owner.tag}!`)
                }

                const blob = save({
                    model: interaction.options.getString('model'),
                    ecid,
                    generator: parseInt(interaction.options.getString('generator', false)),
                    apnonce: interaction.options.getString('apnonce', false),
                    boardconfig: interaction.options.getString('boardconfig')
                })

            }
        }
    }
}