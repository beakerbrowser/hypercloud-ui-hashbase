/* global $ */

// register page js
$(function () {
  var dropdownMenu = $('.nav .dropdown-menu')
  var dropdownMenuToggle = $('.nav .dropdown-menu-link')

  dropdownMenuToggle.click(function () {
    dropdownMenu.toggleClass('open')
  })
})
