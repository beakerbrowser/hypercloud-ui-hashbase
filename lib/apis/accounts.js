const assert = require('assert')
const Stripe = require('stripe')
const {NotFoundError, BadRequestError} = require('../const')

class HashbaseAccountsAPI {
  constructor (cloud, hashbase) {
    assert(typeof cloud.config.stripe.secretKey === 'string')
    this.usersDB = cloud.usersDB
    this.accountsDB = hashbase.accountsDB
    this.stripe = Stripe(cloud.config.stripe.secretKey)
  }

  async upgrade (req, res) {
    var {session} = res.locals
    var {token} = req.body

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

    // lookup user
    var userRecord = await this.usersDB.getByID(session.id)
    if (!userRecord) throw new NotFoundError()
    var hashbaseAccount = await this.accountsDB.getByID(session.id)
    if (!hashbaseAccount) throw new NotFoundError()

    // sanity checks
    // does the user already have an account?
    if (hashbaseAccount.stripeSubscriptionId) {
      // TODO log this event?
      throw new BadRequestError('You already have a plan active! Please contact support.')
    }

    var customerId
    try {
      // create the stripe customer
      if (hashbaseAccount.stripeCustomerId) {
        customerId = hashbaseAccount.stripeCustomerId
      } else {
        let customer = await this.stripe.customers.create({
          email: userRecord.email,
          description: userRecord.username,
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
    Object.assign(hashbaseAccount, {
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
    await this.accountsDB.put(hashbaseAccount)

    // respond
    res.status(200).end()
  }

  async cancelPlan (req, res) {
    var {session} = res.locals

    // lookup user
    var userRecord = await this.usersDB.getByID(session.id)
    if (!userRecord) throw new NotFoundError()
    var hashbaseAccount = await this.accountsDB.getByID(session.id)
    if (!hashbaseAccount) throw new NotFoundError()

    // sanity checks
    // does the user have an account?
    if (!hashbaseAccount.stripeCustomerId) {
      throw new BadRequestError('You\'re not currently on a plan.')
    }
    // does the user have a subscription?
    if (!hashbaseAccount.stripeSubscriptionId) {
      throw new BadRequestError('You\'re not currently on a plan.')
    }

    try {
      // cancel on stripe
      await this.stripe.subscriptions.del(hashbaseAccount.stripeSubscriptionId)
    } catch (err) {
      throw new BadRequestError('Failed to stop your account with Stripe. Try again or contact support.')
    }

    // update local records
    Object.assign(hashbaseAccount, {
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
    await this.accountsDB.put(hashbaseAccount)

    // respond
    res.status(200).end()
  }

}

module.exports = HashbaseAccountsAPI

