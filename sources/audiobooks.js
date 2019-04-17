const needle = require('needle')
const cache = require('../utils/cache')
const host = 'https://www.audiobooks.com'

const constructQuery = (queryJSON) => {
	let query
	try {
	  query = JSON.parse(queryJSON)
	} catch(e) {}
	if (query && query.name && query.artist) {
		if (query.name.includes(' ('))
			query.name = query.name.substr(0, query.name.indexOf(' ('))
		return (query.name.split(' ').join('+') + '+' + query.artist.split(' ').join('+')).toLowerCase()
	}
	return null
}

const toStream = book => {
	return {
		name: 'AudioBooks',
		title: 'View on AudioBooks.com',
		externalUrl: book.friendlyURL
	}
}

module.exports = {
	search: (req) => {
		return new Promise((resolve, reject) => {
			if (req.type != 'audiobook') {
				// type not supported by AudioBooks.com
				resolve([])
				return
			}
			const query = encodeURIComponent(constructQuery(req.queryJSON))
			if (!query) {
				console.error(new Error('Unparsable AudioBooks query for: ' + req.queryJSON))
				resolve([])
				return
			}
			const cached = cache.get('audiobooks', query)
			if (cached) {
				resolve(cached)
				return
			}
			needle.get(host + '/search/autocompleteSearch?json=true&searchString=' + query, (err, resp, body) => {
				if (body && body.data && body.data.results && body.data.results.length) {
					const book = body.data.results[0]
					if (book.type == 'book' && book.name == 'Show me this book!') {
						const results = [toStream(book)]
						cache.set('audiobooks', query, results)
						resolve(results)
					} else
						resolve([])
				} else
					resolve([])
			})
		})
	}
}