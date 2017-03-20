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
    var {session} = res.locals

    // load user, if applicable
    var userRecord = false
    if (session) {
      userRecord = await this.cloud.usersDB.getByID(session.id)
    }

    // respond
    res.render('frontpage', {
      userRecord,
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

    // load user, if applicable
    var userRecord = false
    if (session) {
      userRecord = await this.cloud.usersDB.getByID(session.id)
    }

    res.render('new-archive', {userRecord})
  }

  about (req, res) {
    res.render('about')
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
      reset: req.query.reset
    })
  }

  forgotPassword (req, res) {
    res.render('forgot-password')
  }

  resetPassword (req, res) {
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
    var {session} = res.locals
    if (session) {
      var userRecord = await this.cloud.usersDB.getByID(session.id)
      res.redirect(`/${userRecord.username}`)
    } else {
      res.redirect('/')
    }
  }

  async account (req, res) {
    var {session} = res.locals
    if (!session) throw new ForbiddenError()

    var userRecord = await this.cloud.usersDB.getByID(session.id)
    res.render('account', {
      updated: req.query.updated,
      userRecord,
      ucfirst,
      pluralize
    })
  }

  async accountUpgrade (req, res) {
    var {session} = res.locals
    if (!session) throw new ForbiddenError()

    var userRecord = await this.cloud.usersDB.getByID(session.id)
    res.render('account-upgrade', {userRecord, stripePK: this.config.stripe.publishableKey})
  }

  async accountUpgraded (req, res) {
    var {session} = res.locals
    if (!session) throw new ForbiddenError()

    var userRecord = await this.cloud.usersDB.getByID(session.id)
    res.render('account-upgraded', {userRecord})
  }

  async accountCancelPlan (req, res) {
    var {session} = res.locals
    if (!session) throw new ForbiddenError()

    var userRecord = await this.cloud.usersDB.getByID(session.id)
    res.render('account-cancel-plan', {userRecord})
  }

  async accountCanceledPlan (req, res) {
    var {session} = res.locals
    if (!session) throw new ForbiddenError()

    var userRecord = await this.cloud.usersDB.getByID(session.id)
    res.render('account-canceled-plan', {userRecord})
  }

  async accountChangePassword (req, res) {
    res.render('account-change-password')
  }
}

module.exports = PagesAPI
