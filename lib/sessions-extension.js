const wrap = require('co-express')

// exported api
// =

module.exports = class SessionsExtension {
  constructor (cloud, hashbase) {
    this.accountsDB = hashbase.accountsDB
  }

  middleware () {
    return wrap(async (req, res, next) => {
      // fetch user account record if there's a session
      if (res.locals.session) {
        res.locals.sessionAccount = await this.accountsDB.getByID(res.locals.session.id)
      }
      next()
    })
  }
}
