const assert = require('assert')
const Stripe = require('stripe')
const bytes = require('bytes')
const {NotFoundError, BadRequestError} = require('../const')

class HashbaseAccountsAPI {
  constructor (cloud, hashbase) {
    assert(typeof cloud.config.stripe.secretKey === 'string')
    this.config = cloud.config
    this.lock = cloud.lock
    this.usersDB = cloud.usersDB
    this.accountsDB = hashbase.accountsDB
    this.stripe = Stripe(cloud.config.stripe.secretKey)
  }

  async upgrade (req, res) {
    var {session, sessionUser, sessionAccount} = res.locals
    var {token} = req.body

    // sanity checks
    if (!sessionUser) throw new NotFoundError()
    if (!sessionAccount) throw new NotFoundError()
    // does the user already have an account?
    if (sessionAccount.stripeSubscriptionId) {
      // TODO log this event?
      throw new BadRequestError('You already have a plan active! Please contact support.')
    }

    // lock
    var release = await this.lock('api:hashbase-accounts:update:' + sessionUser.id)
    try {
      // validate token
      try {
        assert(token && typeof token === 'object')
        assert(typeof token.id === 'string')
        assert(token.card && typeof token.card === 'object')
        assert(typeof token.card.id === 'string')
        assert(token.card.address_zip)
        assert(typeof token.card.brand === 'string')
        assert(typeof token.card.country === 'string')
        assert(typeof token.card.cvc_check === 'string')
        assert(typeof token.card.exp_month === 'string')
        assert(typeof token.card.exp_year === 'string')
        assert(typeof token.card.last4 === 'string')
      } catch (e) {
        let err = new Error()
        err.status = 422
        err.message = 'Invalid payment token'
        throw err
      }

      var customerId
      try {
        // create the stripe customer
        if (sessionAccount.stripeCustomerId) {
          customerId = sessionAccount.stripeCustomerId
        } else {
          let customer = await this.stripe.customers.create({
            email: sessionUser.email,
            description: sessionUser.username,
            source: token.id
          })
          customerId = customer.id
        }

        // start them on the plan
        var subscription = await this.stripe.subscriptions.create({
          customer: customerId,
          plan: 'pro'
        })
      } catch (err) {
        throw new BadRequestError('Failed to create an account with Stripe. Try again or contact support.')
      }

      // update local records
      Object.assign(sessionAccount, {
        plan: 'pro',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripeTokenId: token.id,
        stripeCardId: token.card.id,
        stripeCardBrand: token.card.brand,
        stripeCardCountry: token.card.country,
        stripeCardCVCCheck: token.card.cvc_check,
        stripeCardExpMonth: token.card.exp_month,
        stripeCardExpYear: token.card.exp_year,
        stripeCardLast4: token.card.last4
      })
      await this.accountsDB.put(sessionAccount)
      await this.usersDB.update(sessionAccount.id, {
        diskQuota: bytes.parse(this.config.proDiskUsageLimit)
      })

      // respond
      res.status(200).end()
    } finally {
      release()
    }
  }

  async updateCard (req, res) {
    var {session, sessionUser, sessionAccount} = res.locals
    var {token} = req.body

    // sanity checks
    if (!sessionUser) throw new NotFoundError()
    if (!sessionAccount) throw new NotFoundError()

    // lock
    var release = await this.lock('api:hashbase-accounts:update:' + sessionUser.id)
    try {
      // validate token
      try {
        assert(token && typeof token === 'object')
        assert(typeof token.id === 'string')
        assert(token.card && typeof token.card === 'object')
        assert(typeof token.card.id === 'string')
        assert(token.card.address_zip)
        assert(typeof token.card.brand === 'string')
        assert(typeof token.card.country === 'string')
        assert(typeof token.card.cvc_check === 'string')
        assert(typeof token.card.exp_month === 'string')
        assert(typeof token.card.exp_year === 'string')
        assert(typeof token.card.last4 === 'string')
      } catch (e) {
        let err = new Error()
        err.status = 422
        err.message = 'Invalid payment token'
        throw err
      }

      var customerId = sessionAccount.stripeCustomerId

      try {
        // add the new card
        await this.stripe.customers.createSource(customerId, {source: token.id})

        // set the new card as customer's default card
        await this.stripe.customers.update(customerId, {default_source: token.card.id})
      } catch (e) {
        throw new BadRequestError('Failed to update your payment information. Try again or contact support.')
      }
      
      // update local records
      Object.assign(sessionAccount, {
        stripeCustomerId: customerId,
        stripeTokenId: token.id,
        stripeCardId: token.card.id,
        stripeCardBrand: token.card.brand,
        stripeCardCountry: token.card.country,
        stripeCardCVCCheck: token.card.cvc_check,
        stripeCardExpMonth: token.card.exp_month,
        stripeCardExpYear: token.card.exp_year,
        stripeCardLast4: token.card.last4
      })
      await this.accountsDB.put(sessionAccount)

      // respond
      res.status(200).end()
    } finally {
      release()
    }
  }

  async cancelPlan (req, res) {
    var {session, sessionUser, sessionAccount} = res.locals

    // sanity checks
    if (!sessionUser) throw new NotFoundError()
    if (!sessionAccount) throw new NotFoundError()
    // does the user have an account?
    if (!sessionAccount.stripeCustomerId) {
      throw new BadRequestError('You\'re not currently on a plan.')
    }
    // does the user have a subscription?
    if (!sessionAccount.stripeSubscriptionId) {
      throw new BadRequestError('You\'re not currently on a plan.')
    }

    // lock
    var release = await this.lock('api:hashbase-accounts:update:' + sessionUser.id)
    try {
      try {
        // cancel on stripe
        await this.stripe.subscriptions.del(sessionAccount.stripeSubscriptionId)
      } catch (err) {
        throw new BadRequestError('Failed to stop your account with Stripe. Try again or contact support.')
      }

      // update local records
      Object.assign(sessionAccount, {
        plan: 'basic',
        stripeSubscriptionId: null,
        stripeTokenId: null,
        stripeCardId: null,
        stripeCardBrand: null,
        stripeCardCountry: null,
        stripeCardCVCCheck: null,
        stripeCardExpMonth: null,
        stripeCardExpYear: null,
        stripeCardLast4: null
      })
      await this.accountsDB.put(sessionAccount)
      await this.usersDB.update(sessionAccount.id, {diskQuota: null})

      // respond
      res.status(200).end()
    } finally {
      release()
    }
  }

}

module.exports = HashbaseAccountsAPI

