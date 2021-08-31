const { spawnSync } = require('child_process')
const tmpdir = require('os').tmpdir()
const random = require('../lib/random.js')
const fs = require('fs')
const { inherits } = require('util')
module.exports = {
	/**
	 * Save Blobs
	 * @param { object } options Inforamtion needed to save blobs
	 * @param { string } options.ecid Device ECID
	 * @param { string } options.boardconfig Device board config
	 * @param { model } options.model Device model in DeviceTypeX,Y format
	 * @param { string  } options.generator Generator to save blobs with
	 * @param { string? } options.apnonce APNonce to save the blob with
	 * @returns { Promise<string> } the blob
	 */
	save(options) {
		return new Promise(async (resolve, reject) => {
			const { model, ecid, generator, apnonce, boardconfig, buildid,version } = options
			const savepath = `${tmpdir}/${random()}.shsh2`
			const args = [
				'-s',
				'--save-path', savepath,
				'-l',
				'-B', boardconfig,
				'-d', model,
				'-e', ecid,
				'--buildid', buildid,
				'-g', generator
			]
			if (apnonce) args.push('--apnonce', apnonce)
			const result = spawnSync(process.env.TSSCHECKER_PATH, args, { timeout: 30000, shell: false, stdio: 'inherit' })
			if (result.status != 0) return reject(new Error(`TSS Checker exited with code of ` + result.status.toString()))
			if (fs.existsSync(savepath)) {
				resolve({
					ticket: fs.readFileSync(savepath, 'utf8'),
					buildid, ecid, version
				})
				fs.unlinkSync(savepath)
				return
			} else reject (new Error(`Blob does not exist at ${savepath}`))
		})
	}
}
