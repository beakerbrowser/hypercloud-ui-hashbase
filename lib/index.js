const sublevel = require('subleveldown')
const wrap = require('co-express')

const SessionsExtension = require('./sessions-extension')
const HashbaseAccountsDB = require('./dbs/hashbase-accounts')
const PagesAPI = require('./apis/pages')
const UserContentAPI = require('./apis/user-content')
const HashbaseAccountsAPI = require('./apis/accounts')

class Hashbase {
  constructor (cloud) {
    // init components
    this.db = sublevel(cloud.db, 'hashbase')
    this.accountsDB = new HashbaseAccountsDB(cloud, this)
    this.sessionsExtension = new SessionsExtension(cloud, this)

    // init apis
    this.apis = {
      pages: new PagesAPI(cloud, this),
      userContent: new UserContentAPI(cloud, this),
      accounts: new HashbaseAccountsAPI(cloud, this)
    }

    // wrap all methods in promise handling
    wrapAll(this.apis.pages)
    wrapAll(this.apis.userContent)
    wrapAll(this.apis.accounts)
  }
}

module.exports = Hashbase

function wrapAll (api) {
  for (let methodName of Object.getOwnPropertyNames(Object.getPrototypeOf(api))) {
    let method = api[methodName]
    if (typeof method === 'function' && methodName.charAt(0) !== '_') {
      api[methodName] = wrap(method.bind(api))
    }
  }
}
