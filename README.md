# Stremio Add-on for eBooks and Audio Books

See eBooks and Audio Books in Stremio based on the iTunes API and RSS feed.

This add-on gives ebook / audio book price results from various APIs and also has Free Sample audios (that play in Stremio) for some of the audio books.


## Features

- Three Catalogs: Top Paid Books, Top Free Books, Top Audio Books
- Responds to stream request with external URLs (and sample audios) to: iTunes, Audible, AudioBooks.com, DownPour and Rakuten
- Searching eBooks and Audio Books


## Running this add-on locally

```
npm i
npm start
```


## Using remotely in Stremio

Go to the Add-ons page, then click "Community Add-ons", scroll down to "Books", press "Install"


## Understanding the code

- `index.js` defines the manifest and runs the add-on

- `config.js` configuration file, includes cache times

- `/utils` includes `cache.js` (in-memory) and `base64` (atob and btoa used for meta id)

- `/resources` includes files for different resource types: `catalog.js` and `meta.js`

- `/sources` includes `index.js` which requests all sources in parallel (`itunes.js`, `audible.js`, `goodreads.js`, `audiobooks`) and responds to the `stream` request
