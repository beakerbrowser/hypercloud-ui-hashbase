/* global $ */

// login page js
$(function () {
  $('.form-login').on('submit', function (e) {
    e.preventDefault()

    // serialize form values
    var values = {}
    $(this).serializeArray().forEach(function (value) {
      values[value.name] = value.value
    })

    // post to api
    var xhr = $.post('/v1/login', values)
    xhr.done(function (res) {
      // success, redirect
      window.location = '/'
    })
    xhr.fail(function (res) {
      // failure, render errors
      try {
        renderErrors(JSON.parse(res.responseText))
      } catch (e) {
        renderErrors(res.responseText)
      }
    })
  })

  function renderErrors (json) {
    // general error
    $('#error-general').text(json.message)
  }
})
