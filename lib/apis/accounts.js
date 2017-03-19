const assert = require('assert')
const stripe = require('stripe')('sk_test_Tf7rkAgq9t7hNM6BY4VozCsd')
const {NotFoundError, BadRequestError} = require('../const')

class HashbaseAccountsAPI {
  constructor (cloud, hashbase) {
    this.usersDB = cloud.usersDB
    this.accountsDB = hashbase.accountsDB
  }

  async upgradeAccount (req, res) {
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
    if (hashbaseAccount.stripeCustomerId) {
      // TODO log this event?
      throw new BadRequestError('You already have an account. Please contact support.')
      throw err
    }

    try {
      // create the stripe customer
      var customer = await stripe.customers.create({
        email: userRecord.email,
        description: userRecord.username,
        source: token.id
      })

      // start them on the plan
      await stripe.subscriptions.create({
        customer: customer.id,
        plan: 'pro'
      })
    } catch (err) {
      throw new BadRequestError('Failed to create an account with Stripe. Try again or contact support.')
    }

    // update local records
    Object.assign(hashbaseAccount, {
      plan: 'pro',
      stripeCustomerId: customer.id,
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

}

module.exports = HashbaseAccountsAPI

