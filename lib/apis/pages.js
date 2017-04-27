const nicedate = require('nicedate')
const {ForbiddenError} = require('../const')
const {pluralize, ucfirst} = require('../helpers')

class PagesAPI {
  constructor (cloud, hashbase) {
    this.cloud = cloud
    this.hashbase = hashbase
    this.config = cloud.config
  }

  async frontpage (req, res) {
    res.render('frontpage', {
      verified: req.query.verified,
      nicedate,
      activityLimit: 25,
      activity: await this.cloud.activityDB.listGlobalEvents({
        limit: 25,
        lt: req.query.start,
        reverse: true
      })
    })
  }

  async explore (req, res) {
    if (req.query.view === 'activity') {
      return res.render('explore-activity', {
        nicedate,
        activityLimit: 25,
        activity: await this.cloud.activityDB.listGlobalEvents({
          limit: 25,
          lt: req.query.start,
          reverse: true
        })
      })
    }
    var users = await this.cloud.usersDB.list()
    res.render('explore', {users})
  }

  async newArchive (req, res) {
    var {session} = res.locals
    if (!session) res.redirect('/login?redirect=new-archive')
    res.render('new-archive')
  }

  about (req, res) {
    res.render('about')
  }

  pricing (req, res) {
    res.render('pricing')
  }

  terms (req, res) {
    res.render('terms')
  }

  privacy (req, res) {
    res.render('privacy')
  }

  support (req, res) {
    res.render('support')
  }

  login (req, res) {
    res.render('login', {
      reset: req.query.reset // password reset
    })
  }

  forgotPassword (req, res) {
    res.render('forgot-password')
  }

  resetPassword (req, res) {
    var {session} = res.locals
    if (!session) res.redirect('/login?redirect=reset-password')
    res.render('reset-password')
  }

  register (req, res) {
    res.render('register', {
      isOpen: this.config.registration.open
    })
  }

  registered (req, res) {
    res.render('registered', {email: req.query.email})
  }

  async profileRedirect (req, res) {
    var {sessionUser} = res.locals
    if (sessionUser) {
      res.redirect(`/${sessionUser.username}`)
    } else {
      res.redirect('/')
    }
  }

  async account (req, res) {
    var {session, sessionUser} = res.locals
    if (!session) res.redirect('/login?redirect=account') 
    res.render('account', {
      stripePK: this.config.stripe.publishableKey,
      updated: req.query.updated,
      ucfirst,
      pluralize
    })
  }

  async accountUpgrade (req, res) {
    var {session} = res.locals
    if (!session) throw new ForbiddenError()
    res.render('account-upgrade', {stripePK: this.config.stripe.publishableKey})
  }

  async accountUpgraded (req, res) {
    var {session} = res.locals
    if (!session) throw new ForbiddenError()
    res.render('account-upgraded')
  }

  async accountCancelPlan (req, res) {
    var {session} = res.locals
    if (!session) throw new ForbiddenError()
    res.render('account-cancel-plan')
  }

  async accountCanceledPlan (req, res) {
    var {session} = res.locals
    if (!session) throw new ForbiddenError()
    res.render('account-canceled-plan')
  }

  async accountChangePassword (req, res) {
    res.render('account-change-password')
  }
}

module.exports = PagesAPI
