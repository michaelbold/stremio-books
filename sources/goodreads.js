const needle = require('needle')
const cache = require('../utils/cache')

const host = 'https://www.goodreads.com'

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

	// comma in stream titles breaks lines in Stremio
	if (book.title.includes(','))
		book.title = book.title.split(',').join('')

	return {
		name: 'GoodReads',
		title: book.title + '\nby ' + book.author.name,
		externalUrl: host + book.bookUrl
	}
}

module.exports = {
	search: (req) => {
		return new Promise((resolve, reject) => {
			const query = encodeURIComponent(constructQuery(req.queryJSON))
			if (!query) {
				console.error(new Error('Unparsable GoodReads query for: ' + req.queryJSON))
				resolve([])
				return
			}
			const cached = cache.get('goodreads', query)
			if (cached) {
				resolve(cached)
				return
			}
			needle.get(host + '/book/auto_complete?format=json&q=' + query, (err, resp, body) => {
				if (body && Array.isArray(body) && body.length) {
					const results = body.map(toStream)
					cache.set('goodreads', query, results)
					resolve(results)
				} else
					resolve([])
			})
		})
	}
}