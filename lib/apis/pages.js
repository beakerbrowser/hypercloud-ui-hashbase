const nicedate = require('nicedate')

class PagesAPI {
  constructor ({cloud, config}) {
    this.cloud = cloud
    this.config = config
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
    res.render('login')
  }

  register (req, res) {
    res.render('register', {
      isOpen: this.config.registration.open
    })
  }

  registered (req, res) {
    res.render('registered', {email: req.query.email})
  }
}

module.exports = PagesAPI
