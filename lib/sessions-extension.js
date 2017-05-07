const wrap = require('co-express')

// exported api
// =

module.exports = class SessionsExtension {
  constructor (cloud, hashbase) {
    this.config = cloud.config
    this.usersDB = cloud.usersDB
    this.accountsDB = hashbase.accountsDB
  }

  middleware () {
    return wrap(async (req, res, next) => {
      res.locals.sessionAlerts = []

      // fetch user account record if there's a session
      if (res.locals.session) {
        var [sessionUser, sessionAccount] = await Promise.all([
          this.usersDB.getByID(res.locals.session.id),
          this.accountsDB.getByID(res.locals.session.id)
        ])
        res.locals.sessionUser = sessionUser
        res.locals.sessionAccount = sessionAccount

        // add any alerts
        var pct = this.config.getUserDiskQuotaPct(sessionUser)
        if (pct > 1) {
          res.locals.sessionAlerts.push({
            type: 'warning',
            message: 'You are out of disk space!',
            details: 'Click here to review your account.',
            href: '/account'
          })
        } else if (pct > 0.9) {
          res.locals.sessionAlerts.push({
            type: '',
            message: 'You are almost out of disk space!',
            details: 'Click here to review your account.',
            href: '/account'
          })
        }
      }
      next()
    })
  }
}
