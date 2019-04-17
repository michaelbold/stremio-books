const needle = require('needle')
const cheerio = require('cheerio')
const cache = require('../utils/cache')
const base64 = require('../utils/base64')

const algolia = {
	id: 'EAY4EB76JV',
	key: '62e9f8527d18a05acb3d1da857034cc6ec6a7d7bff9351fee43705dc6767e300attributesToRetrieve=%5B%22isbn_13%22%2C%22isbn_10%22%2C%22sku%22%2C%22name%22%2C%22raw_name%22%2C%22subtitle%22%2C%22series%22%2C%22author_display_string%22%2C%22narrator_display_string%22%2C%22categories%22%2C%22meta_keyword%22%2C%22description%22%2C%22original_price%22%2C%22abridgement%22%2C%22group_price%22%2C%22categories_without_path%22%2C%22product_group%22%2C%22runtime%22%2C%22imprint%22%2C%22provider%22%2C%22release_date_unix%22%2C%22release_date%22%2C%22credit_line%22%2C%22volume%22%2C%22units%22%2C%22link_type%22%2C%22has_sample%22%2C%22link_id%22%2C%22algolia_uniqueness_group_id%22%2C%22algolia_uniqueness_priority%22%2C%22search_bias_score%22%2C%22territories%22%2C%22path%22%2C%22meta_title%22%2C%22meta_keywords%22%2C%22meta_description%22%2C%22product_count%22%2C%22objectID%22%2C%22url%22%2C%22visibility_search%22%2C%22visibility_catalog%22%2C%22thumbnail_url%22%2C%22image_url%22%2C%22in_stock%22%2C%22type_id%22%2C%22release_date_formatted%22%2C%22passed_release%22%2C%22value%22%2C%22sub_product_groups%22%2C%22has_sub_prods%22%2C%22sample_url%22%2C%22is_solesource%22%2C%22releaseMonths%22%2C%22genres%22%2C%22language%22%2C%22audience%22%2C%22is_reissue%22%2C%22price.USD.default%22%2C%22price.USD.default_formated%22%2C%22price.USD.group_0%22%2C%22price.USD.group_0_formated%22%2C%22price.USD.special_from_date%22%2C%22price.USD.special_to_date%22%5D&filters='
}

algolia.query = [
  ['x-algolia-agent', 'Algolia for vanilla JavaScript 3.21.1;Magento integration (1.13.0)'],
  ['x-algolia-application-id', algolia.id],
]

const queryString = '?' + algolia.query.map(el => { return el.join('=') }).join('&')

algolia.url = 'https://' + algolia.id.toLowerCase() + '-dsn.algolia.net/1/indexes/live_downpour_en_en_products/query' + queryString

algolia.post = search => {
  return '{"params":"query=' + encodeURIComponent(search) + '&hitsPerPage=6&analyticsTags=autocomplete&facets=' + encodeURIComponent('["categories.level0"]') + '&numericFilters=' + encodeURIComponent('visibility_search=1') + '","apiKey":"'+base64.btoa(algolia.key)+'"}'
}

algolia.headers = {
  'accept': 'application/json',
  'content-type': 'application/x-www-form-urlencoded',
  'Origin': 'https://www.downpour.com',
  'Referer': 'https://www.downpour.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36'
}

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

module.exports = {
	search: (req) => {
		return new Promise((resolve, reject) => {
			if (req.type != 'audiobook') {
				// type not supported
				resolve([])
				return
			}
			const parsed = parseJSON(req.queryJSON)
			const query = constructQuery(parsed)
			if (!query) {
				console.error(new Error('Unparsable Downpour query for: ' + req.queryJSON))
				resolve([])
				return
			}
			const cached = cache.get('downpour', query)
			if (cached) {
				resolve(cached)
				return
			}
			needle.post(algolia.url, algolia.post(query), { headers: algolia.headers }, (err, resp, body) => {
				const data = (body || {}).hits || []
				const results = []
				if (data.length) {
					data.some(book => {
						if (book.author_display_string.toLowerCase() == parsed.artist.toLowerCase() && book.name.toLowerCase().startsWith(parsed.name.toLowerCase())) {
							if (((book.price || {}).USD || {}).default)
								results.push({ name: 'Downpour', title: '$' + book.price.USD.default, externalUrl: 'https://downpour.com' + book.url })
							if (book.sample_url)
								results.push({ name: 'Downpour', title: 'Free Sample', url: 'https:' + book.sample_url })
							return true
						}
					})
					if (results.length)
						cache.set('downpour', query, results)
				}
				resolve(results)
			})

		})
	}
}