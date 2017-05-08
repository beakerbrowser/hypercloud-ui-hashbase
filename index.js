const path = require('path')
const express = require('express')
const lessExpress = require('less-express')
const ejs = require('ejs')

const Hashbase = require('./lib/index')

module.exports = function ({ cloud, config }) {
  var app = express()
  var hashbase = new Hashbase(cloud)

  app.locals = {
    session: false, // default session value
    sessionUser: false,
    sessionAccount: false,
    errors: false, // common default value
    appInfo: {
      version: cloud.version,
      brandname: config.brandname,
      hostname: config.hostname,
      port: config.port,
      proDiskUsageLimit: config.proDiskUsageLimit
    }
  }

  app.engine('html', ejs.renderFile)
  app.set('view engine', 'html')
  app.set('views', path.join(__dirname, 'assets/html'))

  // middleware
  // =

  app.use(hashbase.sessionsExtension.middleware())

  // assets
  // =

  app.get('/assets/css/main.css', lessExpress(path.join(__dirname, 'assets/css/main.less')))
  app.use('/assets/css', express.static(path.join(__dirname, 'assets/css')))
  app.use('/assets/js', express.static(path.join(__dirname, 'assets/js')))
  app.use('/assets/fonts', express.static(path.join(__dirname, 'assets/fonts')))
  app.use('/assets/images', express.static(path.join(__dirname, 'assets/images')))

  // pages
  // =

  app.get('/', hashbase.apis.pages.frontpage)
  app.get('/explore', hashbase.apis.pages.explore)
  app.get('/new-archive', hashbase.apis.pages.newArchive)
  app.get('/about', hashbase.apis.pages.about)
  app.get('/pricing', hashbase.apis.pages.pricing)
  app.get('/terms', hashbase.apis.pages.terms)
  app.get('/privacy', hashbase.apis.pages.privacy)
  app.get('/support', hashbase.apis.pages.support)
  app.get('/login', hashbase.apis.pages.login)
  app.get('/forgot-password', hashbase.apis.pages.forgotPassword)
  app.get('/reset-password', hashbase.apis.pages.resetPassword)
  app.get('/register', hashbase.apis.pages.register)
  app.get('/registered', hashbase.apis.pages.registered)
  app.get('/profile', hashbase.apis.pages.profileRedirect)
  app.get('/account/upgrade', hashbase.apis.pages.accountUpgrade)
  app.get('/account/upgraded', hashbase.apis.pages.accountUpgraded)
  app.get('/account/cancel-plan', hashbase.apis.pages.accountCancelPlan)
  app.get('/account/canceled-plan', hashbase.apis.pages.accountCanceledPlan)
  app.get('/account/change-password', hashbase.apis.pages.accountChangePassword)
  app.get('/account', hashbase.apis.pages.account)

  // accounts api
  // =

  app.post('/v1/hashbase-accounts/upgrade', hashbase.apis.accounts.upgrade)
  app.post('/v1/hashbase-accounts/update-card', hashbase.apis.accounts.updateCard)
  app.post('/v1/hashbase-accounts/cancel-plan', hashbase.apis.accounts.cancelPlan)

  // user pages
  // =

  app.get('/:username([a-z0-9]{3,})/:archivename([a-z0-9-]{3,})', hashbase.apis.userContent.viewArchive)
  app.get('/:username([a-z0-9]{3,})', hashbase.apis.userContent.viewUser)

  // error-handling fallback
  // =

  app.get('*', (req, res) => {
    res.render('404')
  })

  app.use((err, req, res, next) => {
    var contentType = req.accepts(['json', 'html'])

    // validation errors
    if ('isEmpty' in err) {
      return res.status(422).json({
        message: 'There were errors in your submission',
        invalidInputs: true,
        details: err.mapped()
      })
    }

    // common errors
    if ('status' in err) {
      res.status(err.status)
      if (contentType === 'json') {
        res.json(err.body)
      } else {
        res.render('error', { error: err })
      }
      return
    }

    // general uncaught error
    console.error('[ERROR]', err)
    res.status(500)
    var error = {
      message: 'Internal server error',
      internalError: true
    }
    if (contentType === 'json') {
      res.json(error)
    } else {
      res.render('error', { error })
    }
  })

  return app
}
