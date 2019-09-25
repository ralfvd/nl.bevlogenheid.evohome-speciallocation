//var jsonPath = require('jsonpath-plus')
//var http = require('http.min')
//var parseString = require('xml2js').parseString
const Log = require('homey-log').Log;
var Evohomey = require('./lib/evohomey')

function trigger_actions () {
  Homey.log('trigger_actions')

}

function flow_actions () {

  Homey.manager('flow').on('action.set_quickaction', function (callback, args) {
    //Homey.log('QuickAction: ' + args.qa)
    var settings = Homey.manager('settings').get('evohomeaccount')
      if (settings) {
        var evohomesystem = new Evohomey({
          user: settings.user,
          password: settings.password,
          appid: settings.appid
        })
        //Homey.log (settings.password)
        evohomesystem.quickAction(args.qa)
        callback( null, true )
      } else {
        callback ('invalidSettings')
      }
  })

  Homey.manager('flow').on('action.set_quickaction_manual_entry', function (callback, args) {
    //Homey.log('QuickAction: ' + args.qa)
    var settings = Homey.manager('settings').get('evohomeaccount')
      if (settings) {
        var evohomesystem = new Evohomey({
          user: settings.user,
          password: settings.password,
          appid: settings.appid
        })
        //Homey.log (settings.password)
        Homey.log('[trigger] qa manual entry: ' + args.qa )
        switch(args.qa) {
            case "HeatingOff":
            case "Auto":
            case "AutoWithEco":
            case "Away":
            case "Custom":
            case "DayOff":
              evohomesystem.quickAction(args.qa)
              callback (null, true)
              break
            default:
              callback ('invalidSettings')
        }
      } else {
        callback ('invalidSettings')
      }
  })

  Homey.manager('flow').on('action.set_temperature_manual', function (callback, args) {
    //Homey.log('Argumenten die meekomen: ' + JSON.stringify(args.device))
    var new_target = Number(Math.round(args.temp_manual * 2) / 2).toFixed(1)
    Homey.log('device id: ' + args.device.id)
    Homey.log('New temperature: ' + new_target)
    var settings = Homey.manager('settings').get('evohomeaccount')
      if (settings) {
        var evohomesystem = new Evohomey({
          user: settings.user,
          password: settings.password,
          appid: settings.appid
        })
        //Homey.log (settings.password)
        //evohomesystem.quickAction(args.qa)
        evohomesystem.setDeviceTemperature(args.device.id,new_target,function(callback) {
            //module.exports.realtime(device_data,'target_temperature',temp_new)
            evohomeDebugLog(args.device.id + ': new target temperature set: ' + new_target)
            //Homey.log('target setting')
            //Homey.log(device)
            //Homey.log('----')
            //Homey.log(thermostats[device_data.id])
            //Homey.log('target setting')
            //module.exports.realtime(device.data,'target_temperature',new_target)
            //thermostats[device_data.id].state.target_temperature = Number(new_target)
            //Homey.log(thermostats[device_data.id])
            //Homey.log('END SET TARGET')
            callback( null, thermostats[args.device.id].state.target_temperature)
        })
        callback( null, true )
      } else {
        callback ('invalidSettings')
      }
  })

}



var self = {
  init: function() {
     Homey.log("Evohome app started -- app.js")
     Log.captureMessage("Evohome app started")
     flow_actions()
     trigger_actions()
  }
}

module.exports = self;
