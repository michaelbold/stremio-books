const needle = require('needle')
const toMeta = require('./meta').toMeta

const catalogs = {}

const manifestCatalogs = []

const catalogParams = [
  ['books', 'top-paid'],
  ['books', 'top-free'],
  ['audiobooks', 'top-audiobooks']
]

function getCatalog(type, tag, i, cb) {
  needle.get('https://rss.itunes.apple.com/api/v1/us/'+type+'/'+tag+'/all/100/explicit.json', (err, resp, body) => {
    const feed = (body || {}).feed || {}
    const results = (feed || {}).results || []
    if (feed.title && results.length) {
      manifestCatalogs.push({
        id: type+'-'+tag,
        name: feed.title,
        type: 'other'
      })
      catalogs[type+'-'+tag] = results.map(toMeta)
    } else
      console.error(new Error('Could not get catalog for: ' + type + ' / ' + tag))
    i++
    if (catalogParams[i])
      getCatalog(catalogParams[i][0], catalogParams[i][1], i, cb)
    else
      cb(manifestCatalogs)
  })
}

module.exports = {
  populate: () => {
    return new Promise((resolve, reject) => {
      getCatalog(catalogParams[0][0], catalogParams[0][1], 0, cats => {
        resolve(cats)
      })
    })
  },
  get: id => {
    return catalogs[id]
  }
}