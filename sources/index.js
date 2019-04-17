
const async = require('async')
const base64 = require('../utils/base64')

const sources = ['itunes', 'rakuten', 'downpour', 'audiobooks', 'audible']
const apis = {}

sources.forEach(source => {
	apis[source] = require('./' + source)
})

const sourceHandler = {
	parseArgs: args => {
		const idParts = args.id.split(':')
		const type = idParts[0]
		const queryJSON = base64.atob(idParts[1])
		return { id: args.id, type, queryJSON }
	},
	search: args => {
		return new Promise((resolve, reject) => {

			if (!args.id.includes(':')) {
				reject(new Error('Cannot get streams for id: ' + args.id))
				return
			}

			const query = sourceHandler.parseArgs(args)

			const requests = {}

			for (let name in apis) {

				requests[name] = cb => {
					apis[name].search(query).then(resp => {
						cb(null, resp)
					}).catch(err => {
						cb(err)
					})
				}

			}

			async.parallel(requests, (err, results) => {
				let streams = []
				sources.forEach(source => {
					streams = streams.concat(results[source])
				})
				resolve(streams)
			})

		})
	}
}

module.exports = sourceHandler
