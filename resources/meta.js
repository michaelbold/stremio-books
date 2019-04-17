
const itunes = require('../sources/itunes')
const sources = require('../sources')
const base64 = require('../utils/base64')
const config = require('../config')

function normalize(str) {
	// normalize special characters
	// ie: ō -> o
	return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
}

function toMeta(book) {
  const genres = book.genres ? typeof book.genres[0] === 'string' ? book.genres : book.genres.map(el => { return el.name }) : []
  const kind = ((book.wrapperType && book.wrapperType == 'audiobook') || genres.includes('Audiobooks')) ? 'audiobook' : 'ebook'
  const name = book.name || book.trackName || book.collectionName
  const id = kind + ':' + base64.btoa(JSON.stringify({ name: normalize(name), artist: normalize(book.artistName) }))
  const poster = book.artworkUrl100 ? book.artworkUrl100.replace('/100x100', '/200x200') : null
  return {
    id,
    name: name + ' by ' + book.artistName,
    type: 'movie',
    posterShape: 'square',
    logo: poster,
    poster,
    genres,
    releaseInfo: book.releaseDate.split('-')[0],
    background: book.artworkUrl100 ? book.artworkUrl100.replace('/100x100', '/1000x1000') : null
  }
}

module.exports = {
	search: args => {
		return new Promise((resolve, reject) => {

			const type = args.id == 'ebook-search' ? 'ebook' : 'audiobook'

			const query = sources.parseArgs({ id: type + ':' + base64.btoa(JSON.stringify({ query: args.extra.search })) })

			query.getAll = true

			itunes.queue.push(query, (err, resp) => {
				if (err)
					reject(err)
				else
					resolve({ metas: resp.map(toMeta), cacheMaxAge: config.searchCacheTime })
			})

		})
	},
	get: args => {
		return new Promise((resolve, reject) => {
			const query = sources.parseArgs(args)
			itunes.queue.push(query, (err, resp) => {
				if (err)
					reject(err)
				else
					resolve({ meta: toMeta(resp[0]), cacheMaxAge: config.searchCacheTime })
			})
		})
	},
	toMeta
}