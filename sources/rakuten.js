const needle = require('needle')
const cheerio = require('cheerio')
const cache = require('../utils/cache')
const base64 = require('../utils/base64')

const host = 'https://www.rakuten.com'

const parseJSON = queryJSON => {
	let query
	try {
	  query = JSON.parse(queryJSON)
	} catch(e) {}
	return query
}

const constructQuery = query => {
	if (query && query.name && query.artist) {
		if (query.name.includes(' ('))
			query.name = query.name.substr(0, query.name.indexOf(' ('))
		return (query.name + ' ' + query.artist).toLowerCase()
	}
	return null
}

function toTitleCase(str) {
	if (str[0].toLowerCase() == str[0])
		return str.replace(/\w\S*/g, txt => {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
		})
	else
		return str
}

const toStream = book => {

	// comma in stream titles breaks lines in Stremio
	if (book.title.includes(','))
		book.title = book.title.split(',').join('')

	return {
		name: book.shop,
		title: toTitleCase(book.title) + '\n' + book.price,
		externalUrl: book.url
	}
}

const httpOpts = {
	headers: {
		'Accept': '*/*',
		'Accept-Encoding': 'gzip, deflate, br',
		'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
		'Referer': 'https://www.rakuten.com/',
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
		'x-requested-with': 'XMLHttpRequest',
		'Origin': 'https://www.rakuten.com',
	},
	parse_cookies: true,
}

needle.get(host, httpOpts, (err, resp, body) => {
	if (resp.cookies)
		httpOpts.cookies = resp.cookies
})

function parseResults(body, bookTitle) {
	const $ = cheerio.load(body)

	const results = []
	$('.search-blk').each((ij, el) => {
		const elm = $(el)
		const title = elm.find('.title-part').attr('title')
		if (title.toLowerCase().startsWith(bookTitle)) {
			const price = elm.find('.yourprice').text()
			const shop = elm.find('.prox-b.truncate').text()
			const url = decodeURIComponent(elm.find('.blk.pos-rel.nohover').attr('href').split('?store_url=')[1].split('&sourceName=')[0])
			results.push(toStream({ title, price, shop, url }))
		}
	})

	return results
}

module.exports = {
	search: (req) => {
		return new Promise((resolve, reject) => {
			if (req.type != 'ebook') {
				// type not supported
				resolve([])
				return
			}
			const parsed = parseJSON(req.queryJSON)
			const query = encodeURIComponent(constructQuery(parsed))
			if (!query) {
				console.error(new Error('Unparsable Rakuten query for: ' + req.queryJSON))
				resolve([])
				return
			}
			const cached = cache.get('rakuten', query)
			if (cached) {
				resolve(cached)
				return
			}
			needle.get(host + '/searchproducts_v2.htm?keywords=' + query + '&category_id=150000', httpOpts, (err, resp, body) => {

				if (JSON.stringify(resp.cookies) != JSON.stringify(httpOpts.cookies))
					httpOpts.cookies = resp.cookies

				if (body && body.length) {
					const bookTitle = (parsed.name || '').toLowerCase()
					let results = parseResults(body, bookTitle)
					if (results.length) {
						cache.set('rakuten', query, results)
						resolve(results)
					} else {
						needle.get(host + '/searchproducts_v2.htm?keywords=' + encodeURIComponent(parsed.name) + '&category_id=150000', httpOpts, (err, resp, body) => {
							let results = parseResults(body, bookTitle)
							cache.set('rakuten', query, results)
							resolve(results)
						})
					}
				} else
					resolve([])
			})
		})
	}
}