/* global $ */

function initAccount () {
  clearBusy()
  clearError()
  clearSuccess()

  Homey.get('evohomeaccount', function (error, currentEvohomeAccount) {
    if (error) return console.error(error)
    if (currentEvohomeAccount != null) {
      $('#evohomeUsername').val(currentEvohomeAccount['user'])
      $('#evohomePassword').val(currentEvohomeAccount['password'])
      $('#evohomeDebug').prop('checked', currentEvohomeAccount['debug'])
    }
  })
}

function clearEvohomeAccount () {
  Homey.confirm(__('settings.account.messages.confirmClearAccount'), 'warning', function (error, result) {
    if (error) return console.error(error)
    if (result) {
      showBusy(__('settings.account.messages.busyClearing'))
      Homey.set('evohomeaccount', null, function (error, result) {
        if (error) return console.error(error)
        $('#evohomeUsername').val('')
        $('#evohomePassword').val('')
        $('#evohomePolling').prop('checked', true)
        $('#evohomeDebug').prop('checked', false)
        showSuccess(__('settings.account.messages.successClearing'), 3000)
      })
    }
  })
}

function saveEvohomeAccount () {
  var currentEvohomeAccount = {
    user: $('#evohomeUsername').val(),
    password: $('#evohomePassword').val(),
    appid: '91db1612-73fd-4500-91b2-e63b069b185c',
    debug: $('#evohomeDebug').prop('checked')
  }
  showBusy(__('settings.account.messages.busyValidation'))
  $('#saveEvohomeAccount').prop('disabled', true)
  Homey.api('GET', '/validate/account?' + $.param(currentEvohomeAccount), function (error, result) {
    if (error) {
      $('#saveEvohomeAccount').prop('disabled', false)
      return showError(__('settings.account.messages.errorValidation.' + error))
    }
    showBusy(__('settings.account.messages.busySaving'))
    setTimeout(function () {
      Homey.set('evohomeaccount', currentEvohomeAccount, function (error, settings) {
        $('#saveEvohomeAccount').prop('disabled', false)
        if (error) { return showError(__('settings.account.messages.errorSaving')) }
        showSuccess(__('settings.account.messages.successSaving'), 3000)
      })
    }, 2000)
  })
}

function clearBusy () { $('#busy').hide() }
function showBusy (message, showTime) {
  clearError()
  clearSuccess()
  $('#busy span').html(message)
  $('#busy').show()
  if (showTime) $('#busy').delay(showTime).fadeOut()
}

function clearError () { $('#error').hide() }
function showError (message, showTime) {
  clearBusy()
  clearSuccess()
  $('#error span').html(message)
  $('#error').show()
  if (showTime) $('#error').delay(showTime).fadeOut()
}

function clearSuccess () { $('#success').hide() }
function showSuccess (message, showTime) {
  clearBusy()
  clearError()
  $('#success span').html(message)
  $('#success').show()
  if (showTime) $('#success').delay(showTime).fadeOut()
}
