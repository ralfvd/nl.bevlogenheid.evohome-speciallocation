/* global $ */

function showPanel (panel) {
  $('.panel').hide()
  $('.panel-button').removeClass('panel-button-active').addClass('panel-button-inactive')
  $('#panel-button-' + panel).removeClass('panel-button-inactive').addClass('panel-button-active')
  $('#panel-' + panel).show()

  }

function onHomeyReady () {
  initAccount()
  initLogging()
  showPanel(1)

  Homey.ready()
}
