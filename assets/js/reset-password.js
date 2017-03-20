/* global $ URL */

// reset password page js
$(function () {
  $('.form-reset-password').on('submit', function (e) {
    e.preventDefault()

    // serialize form values
    var values = {}
    $(this).serializeArray().forEach(function (value) {
      values[value.name] = value.value
    })

    // pull username and nonce from the url
    var url = new URL(window.location)
    values.username = url.searchParams.get('username')
    values.nonce = url.searchParams.get('nonce')

    // post to api
    var jqxhr = $.post('/v1/account/password', values)
    jqxhr.done(function (res) {
      // success, redirect to login
      window.location = '/login?reset=1'
    })
    jqxhr.fail(function (res) {
      // failure, render errors
      renderErrors(res.responseJSON)
    })
  })

  function renderErrors (json) {
    // general error
    $('#error-general').text(json.message)

    // individual form errors
    var details = json.details || {}
    ;(['newPassword']).forEach(function (name) {
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
