const path = require('path')
const express = require('express')
const lessExpress = require('less-express')
const ejs = require('ejs')
const nicedate = require('nicedate')

const DAT_KEY_REGEX = /([0-9a-f]{64})/i

module.exports = function ({cloud, config}) {
  var app = express()

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

  app.get('/', async (req, res) => {
    var {session} = res.locals

    // load user, if applicable
    var userRecord = false
    if (session) {
      userRecord = await cloud.usersDB.getByID(session.id)
    }

    // respond
    res.render('frontpage', {
      userRecord,
      verified: req.query.verified,
      nicedate,
      activityLimit: 25,
      activity: await cloud.activityDB.listGlobalEvents({
        limit: 25,
        lt: req.query.start,
        reverse: true
      })
    })
  })

  app.get('/explore', async (req, res) => {
    if (req.query.view === 'activity') {
      return res.render('explore-activity', {
        nicedate,
        activityLimit: 25,
        activity: await cloud.activityDB.listGlobalEvents({
          limit: 25,
          lt: req.query.start,
          reverse: true
        })
      })
    }
    var users = await cloud.usersDB.list()
    res.render('explore', {users})
  })

  app.get('/new-archive', async (req, res) => {
    var {session} = res.locals

    // load user, if applicable
    var userRecord = false
    if (session) {
      userRecord = await cloud.usersDB.getByID(session.id)
    }

    res.render('new-archive', {userRecord})
  })

  app.get('/user/:username/:archivename', async (req, res) => {
    // validate & sanitize input
    req.checkParams('username').isAlphanumeric().isLength({ min: 3, max: 16 })
    req.checkParams('archivename').isDatName().isLength({ min: 3, max: 64 })
    ;(await req.getValidationResult()).throw()
    var {username, archivename} = req.params

    // lookup user
    var userRecord = await cloud.usersDB.getByUsername(username)
    if (!userRecord) throw new NotFoundError()

    // lookup archive
    const findFn = (DAT_KEY_REGEX.test(archivename))
      ? a => a.key === archivename
      : a => a.name === archivename
    var archive = userRecord.archives.find(findFn)
    if (!archive) throw new NotFoundError()

    var progress = await cloud.api.archives._getArchiveProgress(archive.key)
    var {session} = res.locals
    res.render('archive', {
      username,
      key: archive.key,
      archivename,
      progress: (progress * 100) | 0,
      isOwner: session && session.id === userRecord.id
    })
  })

  app.get('/user/:username', async (req, res) => {
    // validate & sanitize input
    req.checkParams('username').isAlphanumeric().isLength({ min: 3, max: 16 })
    ;(await req.getValidationResult()).throw()
    var {username} = req.params

    // lookup user
    var userRecord = await cloud.usersDB.getByUsername(username)
    if (!userRecord) throw new NotFoundError()

    var {session} = res.locals
    res.render('user', {userRecord})
  })

  app.get('/about', (req, res) => res.render('about'))
  app.get('/terms', (req, res) => res.render('terms'))
  app.get('/privacy', (req, res) => res.render('privacy'))
  app.get('/support', (req, res) => res.render('support'))
  app.get('/login', async (req, res) => res.render('login'))

  app.get('/register', async (req, res) => {
    res.render('register', {
      isOpen: config.registration.open
    })
  })

  app.get('/registered', async (req, res) => {
    res.render('registered', {email: req.query.email})
  })

  app.get('*', (req, res) => {
    res.render('404')
  })

  // error-handling fallback
  // =

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