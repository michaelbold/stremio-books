const namedQueue = require('named-queue')
const needle = require('needle')
const cache = require('../utils/cache')

const host = 'https://itunes.apple.com'

const queue = new namedQueue((task, cb) => {
	const query = encodeURIComponent(constructQuery(task.queryJSON))

	if (!query) {
	  cb(new Error('Unparsable iTunes query for: ' + task.id))
	  return
	}

	const cached = cache.get('itunes', 'search:'+query)

	if (cached) {
	  cb(null, cached)
	  return
	}

	needle.get(host + '/search?term=' + query + '&media=' + task.type, (err, resp, body) => {
	  const results = (body || {}).results || []
	  if (results.length) {
	  	cache.set('itunes', 'search:'+query, results)
	    cb(null, results)
	  } else {
	    cb(new Error('Cannot get search for: ' + query))
	  }
	})
}, Infinity)

const constructQuery = (queryJSON) => {
    let query
    try {
      query = JSON.parse(queryJSON)
    } catch(e) {}
    if (query) {
      if (query.query)
        return query.query
      else if (query.name && query.artist) {
        if (query.name.includes(' ('))
          query.name = query.name.substr(0, query.name.indexOf(' ('))
        return query.name + ' ' + query.artist
      }
    }
    return null
}

function toStream(book) {
  return {
    name: 'iTunes',
    title: book.formattedPrice || ('$' + book.collectionPrice),
    externalUrl: book.trackId ? host + '/us/book/book/id' + book.trackId : book.collectionId ? host + '/us/audiobook/audiobook/id' + book.collectionId : null
  }
}

module.exports = {
	search: (req) => {
		return new Promise((resolve, reject) => {
			queue.push(req, (err, resp) => {
				if (err)
					reject(err)
				else
					resolve([toStream(resp[0])])
			})
		})
	},
	queue
}