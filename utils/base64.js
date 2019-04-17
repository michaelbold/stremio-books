module.exports = {
	atob: str => {
		return Buffer.from(str, 'base64').toString('binary')
	},
	btoa: str => {
		return Buffer.from(str.toString(), 'binary').toString('base64')
	}
}
