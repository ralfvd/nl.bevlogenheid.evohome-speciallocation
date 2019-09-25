var Evohomey = require('./lib/evohomey.js')

module.exports = [{
  // validate account for use with settings page
  description: 'Validate Evohome account settings',
  method: 'GET',
  path:	'/validate/account',
  requires_authorization: true,
  role: 'owner',
  fn: function (callback, args) {
    var evohomesystem = new Evohomey({
      user: args.query.user,
      password: args.query.password,
      appid: args.query.appid
    })
    evohomesystem.validateAccount(function (error, userId) {
      evohomesystem = null
      switch (error) {
        case null: // success!
          return callback(null, {UserId: userId})
          case 'No username set':
            return callback(1)
          case 'No password set':
            return callback(2)
            case '401':
              return callback(401)
            case '429':
            return callback(429)
          default: // other API error
            return callback(11)
      }
    })
  }
}]
