/* global $ */

// forgot password page js
$(function () {
  $('.form-forgot-password').on('submit', function (e) {
    e.preventDefault()

    // serialize form values
    var values = {}
    $(this).serializeArray().forEach(function (value) {
      values[value.name] = value.value
    })

    // post to api
    var jqxhr = $.post('/v1/forgot-password', values)
    jqxhr.done(function (res) {
      // success, tell user
      renderErrors({message: ''})
      $('#success-msg').text('Check your email inbox for a reset link.')
    })
    jqxhr.fail(function (res) {
      // failure, render errors
      renderErrors(res.responseJSON)
    })
  })

  function renderErrors (json) {
    // general error
    $('#success-msg').text('')
    $('#error-general').text(json.message)

    // individual form errors
    var details = json.details || {}
    ;(['email']).forEach(function (name) {
      if (details[name]) {
        $('#error-' + name)
          .text(details[name].msg)
          .parent()
          .addClass('has-warning')
      } else {
        $('#error-' + name)
          .text('')
          .parent()
          .removeClass('has-warning')
      }
    })
  }
})
