var assert = require('assert')
var levelPromise = require('level-promise')
var sublevel = require('subleveldown')

// exported api
// =

class HashbaseAccountsDB {
  constructor (cloud, hashbase) {
    // create levels and indexer
    this.accountsDB = sublevel(hashbase.db, 'accounts', { valueEncoding: 'json' })

    // promisify
    levelPromise.install(this.accountsDB)

    // connect to users emitters
    cloud.usersDB.on('create', this.onUserCreate.bind(this))
    cloud.usersDB.on('del', this.onUserDel.bind(this))
  }

  // event handlers
  //

  onUserCreate (record) {
    this.create({id: record.id})
  }

  onUserDel (record) {
    this.del({id: record.id})
  }

  // basic ops
  // =

  async create (record) {
    assert(record && typeof record === 'object')
    assert(typeof record.id === 'string')
    record = Object.assign({}, HashbaseAccountsDB.defaults, record)
    record.createdAt = Date.now()
    await this.put(record)
    return record
  }

  async put (record) {
    assert(typeof record.id === 'string')
    record.updatedAt = Date.now()
    await this.accountsDB.put(record.id, record)
  }

  async del (record) {
    assert(record && typeof record === 'object')
    assert(typeof record.id === 'string')
    await this.accountsDB.del(record.id)
  }

  // getters
  // =

  async getByID (id) {
    assert(typeof id === 'string')
    try {
      return await this.accountsDB.get(id)
    } catch (e) {
      if (e.notFound) return null
      throw e
    }
  }
}
module.exports = HashbaseAccountsDB

// default user-record values
HashbaseAccountsDB.defaults = {
  id: null,

  plan: 'basic',

  stripeCustomerId: null,
  stripeTokenId: null,
  stripeCardId: null,
  stripeCardBrand: null,
  stripeCardCountry: null,
  stripeCardCVCCheck: null,
  stripeCardExpMonth: null,
  stripeCardExpYear: null,
  stripeCardLast4: null,

  updatedAt: 0,
  createdAt: 0
}
