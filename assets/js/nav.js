/* global $ */

// nav js
$(function () {
  var dropdownMenu = $('.nav .dropdown-menu')
  var dropdownMenuToggle = $('.nav .dropdown-menu-link')
  var mobileNav = $('.mobile-nav')
  var mobileNavToggle = $('.mobile-nav-toggle')

  dropdownMenuToggle.click(function () {
    dropdownMenu.toggleClass('open')
  })

  mobileNavToggle.click(function () {
    mobileNav.toggleClass('open')
  })
})
