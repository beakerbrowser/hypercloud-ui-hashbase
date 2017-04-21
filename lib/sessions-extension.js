const wrap = require('co-express')

// exported api
// =

module.exports = class SessionsExtension {
  constructor (cloud, hashbase) {
    this.usersDB = cloud.usersDB
    this.accountsDB = hashbase.accountsDB
  }

  middleware () {
    return wrap(async (req, res, next) => {
      // fetch user account record if there's a session
      if (res.locals.session) {
        var [sessionUser, sessionAccount] = await Promise.all([
          this.usersDB.getByID(res.locals.session.id),
          this.accountsDB.getByID(res.locals.session.id)
        ])
        res.locals.sessionUser = sessionUser
        res.locals.sessionAccount = sessionAccount
      }
      next()
    })
  }
}
