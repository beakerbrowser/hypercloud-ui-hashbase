/* global $ */

// account cancel plan page js
$(function () {
  // form submit
  $('.form-account-cancel-plan').on('submit', function (e) {
    e.preventDefault()

    toggleSpinner(true)

    // post to api
    var jqxhr = $.post('/v1/hashbase-accounts/cancel-plan')
    jqxhr.done(function (res) {
      // success, redirect
      window.location = '/account/canceled-plan'
    })
    jqxhr.fail(function (res) {
      // failure, render errors
      toggleSpinner(false)
      $('#errors').text(res.responseJSON && res.responseJSON.message || 'Internal server error. Please contact support.')
    })
  })

  function toggleSpinner (on) {
    if (on) {
      $('#submit-btn').attr('disabled', 'disabled').html('<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>')
    } else {
      $('#submit-btn').attr('disabled', null).html('Yes, cancel it')
    }
  }
})
