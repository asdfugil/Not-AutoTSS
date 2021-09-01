const { spawnSync, execSync } = require('child_process')
const tmpdir = require('os').tmpdir()
const random = require('../lib/random.js')
const fs = require('fs')
module.exports = {
	/**
	 * Save Blobs
	 * @param { object } options Inforamtion needed to save blobs
	 * @param { string } options.ecid Device ECID
	 * @param { string } options.boardconfig Device board config
	 * @param { string } options.model Device model in DeviceTypeX,Y format
	 * @param { string  } options.generator Generator to save blobs with
	 * @param { string? } options.apnonce APNonce to save the blob with
	 * @param { fs.PathLike } options.manifest Path to build manifest
	 * @returns { Promise<string> } the blob
	 */
	save(options) {
		return new Promise(async (resolve, reject) => {
			const { model, ecid, generator, apnonce, boardconfig, buildid,version, manifest } = options
			const savepath = `${tmpdir}/${random()}`
			fs.mkdirSync(savepath)
			const args = [
				'-s',
				'--save-path', savepath,
				'-B', boardconfig,
				'-d', model,
				'-e', ecid,
				'-m', manifest,
				'-g', generator
			]
			if (apnonce) args.push('--apnonce', apnonce)
			const result = spawnSync(process.env.TSSCHECKER_PATH, args, { timeout: 30000, shell: false, stdio: 'inherit' })
			if (result.status != 0) return reject(new Error(`TSS Checker exited with code of ` + result.status.toString()))
			if (fs.existsSync(savepath)) {
				resolve({
					ticket: fs.readFileSync(savepath + '/' + fs.readdirSync(`${savepath}`)[0], 'utf8'),
					name: fs.readdirSync(`${savepath}`)[0],
					buildid, ecid, version
				})
				fs.rm(savepath,{ recursive: true ,force: true })
				return
			} else reject (new Error(`Blob does not exist at ${savepath}`))
		})
	}
}
