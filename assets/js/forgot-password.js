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
      $('#success-msg').text('Check your email inbox for a reset link.')
    })
  })
})
