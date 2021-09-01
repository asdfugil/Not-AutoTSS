const { device } = require('../lib/models.js')
const { store } = require('../lib/tss.js')
async function save_all() {
    const everything = await device.findAll({ raw: true })
    for (const thing of everything) {
        const { generator, ecid, apnonce, boardconfig, model } = thing
        store(generator, ecid, apnonce, boardconfig, model)
        .catch(console.error)
    }
}
module.exports = save_all