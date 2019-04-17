const package = require('./package')
const meta = require('./resources/meta')
const catalogs = require('./resources/catalogs')
const sources = require('./sources')
const config = require('./config')

const manifest = {
    id: 'org.books',
    version: package.version,
    logo: 'https://library.lapeer.org/children/images/mypc-website-icon-2-books.png/@@images/62152f98-be65-43be-8fe9-e7dcb97f5646.png',
    name: 'Books',
    description: 'Audio Books and eBooks from the iTunes, Audible, GoodReads and others',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'other'],
    idPrefixes: ['ebook:', 'audiobook:'],
    catalogs: [
      {
        id: 'audiobook-search',
        name: 'Audio Books',
        type: 'other',
        extra: [
          { name: 'search', isRequired: true }
        ]
      }, {
        id: 'ebook-search',
        name: 'eBooks',
        type: 'other',
        extra: [
          { name: 'search', isRequired: true }
        ]
      }
    ]
}

module.exports = catalogs.populate().then(manifestCatalogs => {

  manifest.catalogs = manifest.catalogs.concat(manifestCatalogs)

  const { addonBuilder, getInterface }  = require('stremio-addon-sdk')

  const addon = new addonBuilder(manifest)

  addon.defineCatalogHandler(args => {
    if (args.extra.search)
      return meta.search(args)
    else
      return Promise.resolve({ metas: catalogs.get(args.id), cacheMaxAge: config.cacheTime })
  })

  addon.defineMetaHandler(meta.get)

  addon.defineStreamHandler(args => {
    return sources.search(args).then(resp => {
      return { streams: resp, cacheMaxAge: config.searchCacheTime }
    })
  })

  setInterval(() => {
    catalogs.populate().then(() => {}).catch(() => {})
  }, config.cacheTime)

  return addon.getInterface()

})
