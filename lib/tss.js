const { spawnSync } = require('child_process')
module.exports = {
	/**
	 * Save Blobs
	 * @param { object } options Inforamtion needed to save blobs
	 * @param { BigInt | string } options.ecid Device ECID
	 * @param { string } options.boardconfig Device board config
	 * @param { model } options.model Device model in DeviceTypeX,Y format
	 * @param { BigInt | string  } options.generator Generator to save blobs with
	 * @param { string? } options.apnonce APNonce to save the blob with
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
			'-e', ecid.toString(),
			'-g', '0x' + generator.toString(16)
		]
		if (apnonce) args.push('--apnonce', apnonce)
		const { stdout } = spawnSync(process.env.TSSCHECKER_PATH, args, { timeout: 30000, shell: false })
		const ticket = stdout
			.toString()
			.split(' bytes plist:')[1]
			.split('Firmware version ')[0]
			.trim()
		const [ version, build_no ] = stdout
			.toString()
			.split(' bytes plist:')[1]
			.split('Firmware version ')[1]
			.split(' IS signed!\n\n')[0]
			.split(' ')
		return { ticket, version, build_no }
	}
}
