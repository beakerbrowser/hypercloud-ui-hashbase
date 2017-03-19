const path = require('path')
const express = require('express')
const lessExpress = require('less-express')
const wrap = require('co-express')
const ejs = require('ejs')

const PagesAPI = require('./lib/apis/pages')
const UsersAPI = require('./lib/apis/users')

module.exports = function ({cloud, config}) {
  var app = express()
  var apis = {
    pages: new PagesAPI({cloud, config}),
    users: new UsersAPI({cloud, config})
  }

  // wrap all methods in promise handling
  wrapAll(apis.pages)
  wrapAll(apis.users)

  app.locals = {
    session: false, // default session value
    errors: false, // common default value
    appInfo: {
      version: cloud.version,
      brandname: config.brandname,
      hostname: config.hostname,
      port: config.port
    }
  }

  app.engine('html', ejs.renderFile)
  app.set('view engine', 'html')
  app.set('views', path.join(__dirname, 'assets/html'))

  // assets
  // =

  app.get('/assets/css/main.css', lessExpress(path.join(__dirname, 'assets/css/main.less')))
  app.use('/assets/css', express.static(path.join(__dirname, 'assets/css')))
  app.use('/assets/js', express.static(path.join(__dirname, 'assets/js')))

  // pages
  // =

  app.get('/', apis.pages.frontpage)
  app.get('/explore', apis.pages.explore)
  app.get('/new-archive', apis.pages.newArchive)
  app.get('/about', apis.pages.about)
  app.get('/terms', apis.pages.terms)
  app.get('/privacy', apis.pages.privacy)
  app.get('/support', apis.pages.support)
  app.get('/login', apis.pages.login)
  app.get('/register', apis.pages.register)
  app.get('/registered', apis.pages.registered)

  // user pages
  // =

  app.get('/:username([a-z0-9]{3,})/:archivename([a-z0-9]{3,})', apis.users.viewArchive)
  app.get('/:username([a-z0-9]{3,})', apis.users.viewUser)

  // error-handling fallback
  // =

  app.get('*', (req, res) => {
    res.render('404')
  })

  app.use((err, req, res, next) => {
    // common errors
    if ('status' in err) {
      res.status(err.status)
      res.render('error', { error: err })
      return
    }

    // general uncaught error
    console.error('[ERROR]', err)
    res.status(500)
    var error = {
      message: 'Internal server error',
      internalError: true
    }
    res.render('error', {error})
  })

  return app
}

function wrapAll (api) {
  for (let methodName of Object.getOwnPropertyNames(Object.getPrototypeOf(api))) {
    let method = api[methodName]
    if (typeof method === 'function' && methodName.charAt(0) !== '_') {
      api[methodName] = wrap(method.bind(api))
    }
  }
}
