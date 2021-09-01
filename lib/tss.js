const { spawnSync, execSync } = require('child_process')
const tmpdir = require('os').tmpdir()
const random = require('../lib/random.js')
const fs = require('fs')
const fetch = require('node-fetch')
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
			const { model, ecid, generator, apnonce, boardconfig, buildid, version, manifest } = options
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
			const result = spawnSync(process.env.TSSCHECKER_PATH, args, { timeout: 30000, shell: false })
			if (result.status != 0) return reject(new Error(`TSS Checker exited with code of ` + result.status.toString()))
			if (fs.existsSync(savepath)) {
				resolve({
					ticket: fs.readFileSync(savepath + '/' + fs.readdirSync(`${savepath}`)[0], 'utf8'),
					name: fs.readdirSync(`${savepath}`)[0],
					buildid, ecid, version
				})
				fs.rmSync(savepath, { recursive: true, force: true })
				return
			} else reject(new Error(`Blob does not exist at ${savepath}`))
		})
	},
	async store(generator, ecid, apnonce, boardconfig, model) {
		let generators;
		if (!generator)
			generators = ['0xbd34a880be0b53f3', '0x1111111111111111']
		else
			generators = [`${generator.toString(16)}`]
		const signed_stable_fw = await fetch('https://api.ipsw.me/v4/device/' + model, {
			headers: { 'user-agent': 'Not-AutoTSS/0' }
		})
		.then(response => response.json())
		.then(json => json.firmwares.filter(x => x.signed))

		const signed_fw = await fetch('https://api.m1sta.xyz/betas/' + model, {
			headers: { 'user-agent': 'Not-AutoTSS/0' }
		})
			.then(response => response.json())
			.then(json => json.filter(x => x.signed))
		signed_fw.push(...signed_stable_fw)

		for (gen of generators) {
			const blobs = await Promise.all(signed_fw.map(fw => {
				if (fs.existsSync(`./blobs/${ecid}/${fw.version}/${fw.buildid}`) && fs.readdirSync(`./blobs/${ecid}/${fw.version}/${fw.buildid}`)[0]?.endsWith('.shsh2')) {
					return false
				}
				const manifest_dir = `./buildmanifests/${model}/${fw.version}/${fw.buildid}`
				if (!fs.existsSync(manifest_dir)) fs.mkdirSync(manifest_dir, { recursive: true })
				if (!fs.existsSync(manifest_dir + `/BuildManifest.plist`)) spawnSync(process.env.PZB_PATH, ['-g', 'BuildManifest.plist', fw.url], { cwd: manifest_dir })
				// async
				const promise = module.exports.save({ model, ecid, generator: gen, apnonce, boardconfig, buildid: fw.buildid, version: fw.version, manifest: manifest_dir + `/BuildManifest.plist` })
				return promise
			}))
			for (const blob of blobs) {
				if (!blob) return
				const blob_save_path = `./blobs/${ecid.toString(16)}/${blob.version}/${blob.buildid}${apnonce ? `/apnonce-${apnonce}` : ''}`
				if (!fs.existsSync(blob_save_path)) fs.mkdirSync(blob_save_path, { recursive: true })
				fs.writeFileSync(blob_save_path + '/' + blob.name, blob.ticket)
			}
		}
	}
}
