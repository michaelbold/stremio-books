const needle = require('needle')
const host = 'https://www.audible.com'

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

const toStream = query => {
	return {
		name: 'Audible',
		title: 'Search on Audible',
		externalUrl: host + '/search?keywords=' + query
	}
}

module.exports = {
	search: (req) => {
		return new Promise((resolve, reject) => {
			if (req.type != 'audiobook') {
				// type not supported by Audible
				resolve([])
				return
			}
			const query = constructQuery(req.queryJSON)
			if (!query) {
				reject(new Error('Unparsable Audible query for: ' + query))
				return
			}
			resolve([toStream(query)])
		})
	}
}