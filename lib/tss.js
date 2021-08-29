const { spawnSync } = require('child_process')
module.exports = {
	/**
	 * Save Blobs
	 * @param { Object } options 
	 * @returns the blob
	 */
	save(options) {
		const { model, ecid, generator, apnonce, boardconfig } = options
		let baseband = false
		if (model.includes('iPhone')) baseband = true
		const args = [
			'--print-tss-response',
			'-l',
			'-B', boardconfig,
			'-d', model,
			'-e', ecid,
			'-g', '0x' + generator.toString(16)
		]
		if (apnonce) args.push('--apnonce', apnonce)
		const { stdout } = spawnSync(process.env.TSSCHECKER_PATH, args, { timeout: 30000, shell: false })
		const ticket = stdout
			.toString()
			.split(' bytes plist:')[1]
			.split('Firmware version ')[0]
			.trim()
		return ticket
	}
}
