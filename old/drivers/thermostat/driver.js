var Evohomey = require('../../lib/evohomey');
var http = require('http.min')
var Util = require('../../lib/util.js')
var jsonPath = require('jsonpath-plus');
var devices = {};
var thermostats = {}
var number_of_devices = 0
var sessionID = ("empty");
var userID = ("empty");
var locationID = ("empty");
var allinformation = [];
const Log = require('homey-log').Log;

var debugSetting = true;
var debugLog = [];

function evohomeDebugLog(message, data) {
  if (!debugSetting) {
        return;
  }
  if (!debugLog) {
        debugLog = [];
  }
  if (!data) {
      data = null;
  }
  Homey.manager('api').realtime('evohomeLog', {datetime: new Date(), message: message, data: data});
  debugLog.push({datetime: new Date(), message: message, data: data});
  if (debugLog.length > 100) debugLog.splice(0, 1);
  if (data == null) {
    Homey.log(Util.epochToTimeFormatter(), message);
  } else {
    Homey.log(Util.epochToTimeFormatter(), message, data);
  };
  Homey.manager('settings').set('evohomeLog', debugLog);
} // function evohomeDebugLog

var self = module.exports = {

  init : function (devices_data, callback) {

    Homey.log ('number of device: ' + number_of_devices)

    Homey.manager('flow').on('action.reset_temperature', function( callback, args, state ) {
            Homey.log('action reset temperature')
            Homey.log (args.device.id)
            var settings = Homey.manager('settings').get('evohomeaccount')
            evohomeDebugLog('[action] reset temperature ; settings: ' + settings)
              if (settings) {
                //Homey.log(settings.appid)
                var evohomesystem = new Evohomey({
                  user: settings.user,
                  password: settings.password,
                  appid: settings.appid
                })
              }
              evohomeDebugLog ('[capabilities] reset temperature: ' + args.device.id)
              evohomesystem.resetDeviceTemperature(args.device.id,function(callback) {
                    //module.exports.realtime(device_data,'target_temperature',temp_new)
                    evohomeDebugLog(args.device.id + ': target temperature reset ')
                    // be aware, target_temperature is now not correct, only when next update cycle executes
                    callback( null, true);
                })

    })

    Homey.manager('flow').on('trigger.measure_temperature', function (callback, args) {
      Homey.log('trigger started')
      evohomeDebugLog('[trigger] temp changed: ' + args)
      // if( args.arg_id == 'something' )
      callback(null, true); // true to make the flow continue, or false to abort
  })

    Homey.manager('flow').on('trigger.any_measure_temp_changed', function (callback, args) {
      Homey.log('flow started')
      evohomeDebugLog('[trigger] any temp changed: ' + args)
      // if( args.arg_id == 'something' )
      callback(null, true); // true to make the flow continue, or false to abort
  })

    Homey.manager('flow').on('trigger.quickaction_changed_externally', function (callback, args) {
      Homey.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      Homey.log('QuickAction mode changed: ' + args)
      if (args) {
        callback( null, true )
        return
      }
      callback(null,false)
    })


      // when the driver starts, Homey rebooted. Initialize all previously paired devices.
      Homey.log('----devices data----')
      Homey.log(devices_data)
      Homey.log('----devices data----')
      devices_data.forEach(function(device_data){
          Homey.log('===== device data====')
          Homey.log(device_data)
          Homey.log('===== device data====')
          //Homey.log('START @@@@@ Thermostat data @@@@')
          //Homey.log('initializing:' + device_data.id + ': ' + device_data.name)
          number_of_devices++
          Homey.log(number_of_devices)
          thermostats[ device_data.id ] = {
                id : device_data.id,
                data    : device_data,
                state   : {
                  measure_temperature: false,
                  target_temperature: false
                }

            }
          //Homey.log(thermostats)
          //Homey.log('END @@@@@@ Thermostat data @@@@ ')
          devices[ device_data.id ] = {
                  data    : device_data,
                  state   : {
                    measure_temperature: false,
                    target_temperature: false
                  }

              }

          //Homey.log(devices[ device_data.id ])
          //self.getState( device_data )
      })
      var settings = Homey.manager('settings').get('evohomeaccount')
        if (settings) {
          var evohomesystem = new Evohomey({
            user: settings.user,
            password: settings.password,
            appid: settings.appid
          })
        }
      // initial update after start
      Homey.log('initial  devices_data lengte: ' + devices_data.length)
      Homey.log('initial thermostats lengte: ' + thermostats.length)

      if ( number_of_devices > 0 ) {
        if (settings) {
          var timestamp_initial = new Date()
          Homey.log ("initial update: " + timestamp_initial)
          self.updateState(evohomesystem,devices_data,'true',callback)
        }

        //evohomesystem.updateState(devices, devices_data,function(callback){
        //devices.push
        //})
      }
      evohomeDebugLog('Evohome app started')
      // start interval
      setInterval(function(){
        var timestamp_recurring = new Date()
        evohomeDebugLog('[Evohome] Recurring Interval devices: ' + number_of_devices + ' : '+ timestamp_recurring)
        //Homey.log('Number of devices to be updated: ' + thermostats.length)
        Homey.log('START ^^^^^^^^ Number of devices check')
        Homey.log(number_of_devices)
        Homey.log(Object.keys(thermostats).length)
        Homey.log('END ^^^^^^^^ Number of devices check')
        if ( number_of_devices != 0 ) {
          var settings = Homey.manager('settings').get('evohomeaccount')
            if (settings) {
              var evohomesystem = new Evohomey({
                user: settings.user,
                password: settings.password,
                appid: settings.appid
              })
            }
          if (settings) {
            Homey.log('start updateState > 0 devices')
            //Homey.log(devices)
            //Homey.log('recurring devices_data lengte: ' + devices_data.length)
            //Homey.log('recurring thermostats lengte: ' + thermostats.length)
            //Homey.log(devices)
            self.updateState(evohomesystem,number_of_devices,'false',callback)
            }
          }
        }, 1000 * 60 * 5)
      callback()
  },

  updateState: function ( evohomesystem, number_of_devices, initial_run,callback) {
    var rawdata =[]

    evohomesystem.getAllInformation(function(rawdata) {
      // First update: quickAction state
      Homey.log('quickaction updatestate')
      var qa_old = Homey.manager('settings').get('qa_status')
      var options = {
    		uri: 'https://tccna.honeywell.com/Auth/OAuth/Token',
    	  headers: {
    			'Authorization': 'Basic YjAxM2FhMjYtOTcyNC00ZGJkLTg4OTctMDQ4YjlhYWRhMjQ5OnRlc3Q=',
    			'Accept': 'application/json, application/xml, text/json, text/x-json, text/javascript, text/xml'
    		},
    		json: true,
    		form: {
    			'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    			'Host': 'rs.alarmnet.com/',
    			'Cache-Control':'no-store no-cache',
    			'Pragma': 'no-cache',
    			'grant_type': 'password',
    			'scope': 'EMEA-V1-Basic EMEA-V1-Anonymous EMEA-V1-Get-Current-User-Account',
    			'Username': evohomesystem.user,
    			'Password': evohomesystem.password,
    			'Connection': 'Keep-Alive'
    		}
    	}
    		http.put(options).then(function (data) {
          //var resultaat = JSON.parse(data)
    			var access_token = data.data.access_token
    	  	Homey.log('Response access token:', data.data.access_token)
        	// User data
    			var options = {
    				uri: 'https://tccna.honeywell.com/WebAPI/emea/api/v1/userAccount',
    				headers : {
    						'Authorization': 'bearer ' + access_token,
    						'applicationId': 'b013aa26-9724-4dbd-8897-048b9aada249',
    						'Accept': 'application/json, application/xml, text/json, text/x-json, text/javascript, text/xml'
    				}
    			}
    			http.get(options).then(function (data) {
    				 console.log('Userdata:', JSON.parse(data.data).userId)
    				 var userID = JSON.parse(data.data).userId
    				 // Installation data
    				 var options = {
    	 				uri: 'https://tccna.honeywell.com/WebAPI/emea/api/v1/location/installationInfo?userId=' + userID + '&includeTemperatureControlSystems=True',
    	 				headers : {
    	 						'Authorization': 'bearer ' + access_token,
    	 						'applicationId': 'b013aa26-9724-4dbd-8897-048b9aada249',
    	 						'Accept': 'application/json, application/xml, text/json, text/x-json, text/javascript, text/xml'
    	 				}
    	 			}
    	 			http.get(options).then(function (data) {
    	 				 var systemID = JSON.parse(data.data)[0].gateways[0].temperatureControlSystems[0].systemId
    					 // System status
    					 var options = {
    		 				uri: 'https://tccna.honeywell.com/WebAPI/emea/api/v1/temperatureControlSystem/' + systemID + '/status',
    		 				headers : {
    		 						'Authorization': 'bearer ' + access_token,
    		 						'applicationId': 'b013aa26-9724-4dbd-8897-048b9aada249',
    		 						'Accept': 'application/json, application/xml, text/json, text/x-json, text/javascript, text/xml'
    		 				}
    		 			}
    		 			http.get(options).then(function (data) {
    		 				 console.log('System status:', JSON.parse(data.data).systemModeStatus.mode)
    						 var qa_new = JSON.parse(data.data).systemModeStatus.mode
                 if (qa_old) {
                   if (qa_old != qa_new) {
                     Homey.manager('settings').set('qa_status',qa_new)
                     evohomeDebugLog ('[updateState]: quickAction updated: old: ' + qa_old + ' new: ' + qa_new)
                     var tokens = { 'qa_name' : qa_new }
                     Homey.log (tokens)
                     Homey.manager('flow').trigger('quickaction_changed_externally', tokens)
                    } else {
                     evohomeDebugLog ('[updateState]: quickAction no update: ' + qa_old)
                   }
                 } else {
                   Homey.manager('settings').set('qa_status',qa_new)
                   evohomeDebugLog ('[updateState]: quickAction initial set: ' + qa_new)
                 }
              })
            })
          })
        })

      // Second update: devices state
    var rawdevices = rawdata[0]["devices"]
    rawdevices.forEach(function(entry){
        //Homey.log(entry["deviceID"] + ' checken...')
       //Homey.log('START %%%% Thermostat data %%%%')
       //Homey.log(thermostats)
       //Homey.log('END %%%% Thermostat data %%%%')
       Object.keys(thermostats).forEach(function (id) {

          //var temp_new = Number(Math.floor(Math.random() * (30 - 5) + 5))
          //Homey.log(temp_new)
          //module.exports.realtime(thermostats[id],'measure_temperature',temp_new)

            //Homey.log(id)
          //Homey.log (entry["deviceID"] + ' vergelijken met ' + device_data.id)
         if (id == entry["deviceID"]) {
            //evohomeDebugLog('[updateState] Device found: ' + thermostats[id].data.name)

            // Test update
            //Homey.log('$$$$$$$ realtime update $$$$$$')
            //var temp_new = Number(Math.floor(Math.random() * (30 - 5) + 5))
            //Homey.log(temp_new)
            //module.exports.realtime(thermostats[id],'measure_temperature',temp_new)
            //var temp_new = Number(Math.floor(Math.random() * (30 - 5) + 5))
            //Homey.log(temp_new)
            //Homey.log(thermostats[id].data)
            //module.exports.realtime(thermostats[id].data,'measure_temperature',temp_new)
            //var temp_new = Number(Math.floor(Math.random() * (30 - 5) + 5))
            //Homey.log(temp_new)
            //module.exports.realtime(thermostats[id].data.id,'measure_temperature',temp_new)
            //Homey.log('$$$$$$$ realtime update end $$$$$$')

            // voer updates uit
            // check of temperatuur veranderd is
            var temp_old = Number(thermostats[id].state.measure_temperature)
            var temp_new = Number(entry["thermostat"]["indoorTemperature"].toFixed(2))
            thermostats[ id ].state.measure_temperature = temp_new
            var target_temp_old = Number(thermostats[ id ].state.target_temperature)
            var target_temp_new = Number(entry["thermostat"]["changeableValues"]["heatSetpoint"]["value"])
            thermostats[ id ].state.target_temperature = Number(entry["thermostat"]["changeableValues"]["heatSetpoint"]["value"].toFixed(2))
            //module.exports.realtime(thermostats[id].data,'measure_temperature',temp_new + 1)
            Homey.log (entry["thermostat"]["changeableValues"]["heatSetpoint"]["value"])
            Homey.log ('------- Target temp ------')
            Homey.log ('old: ' + target_temp_old)
            Homey.log ('new: ' + target_temp_new)
            Homey.log ('------- Target temp ------')
            if ( target_temp_old != target_temp_new)
            {
              if ( initial_run == 'false') {
              Homey.log ('target temp verschil gevonden')
              module.exports.realtime(thermostats[id].data,'target_temperature',target_temp_new)
              evohomeDebugLog('[updateState]: target_temperature update: ' + thermostats[id].data.name + ' old: ' + target_temp_old + ' new: ' + target_temp_new)
              }
            }
            //Homey.log(thermostats[id].data.name)
            //Homey.log(temp_new)
            //Homey.log('temp change test')
            if ( temp_old != temp_new) {
              //module.exports.realtime(thermostats[id].data,'measure_temperature',temp_new + 2)
              Homey.log ('temperatuur verschil gevonden')
              //Homey.log (thermostats[id].state)
              //thermostats[ id ].state.measure_temperature = temp_new
              //Homey.log (thermostats[id].state)
              //module.exports.realtime(thermostats[id].data,'measure_temperature',temp_new + 3)
              // door deze regel onder gaat de realtime update mis
              //thermostats[ id ].data.temp = temp_new
              // deze regel boven
              // During initial run, don't trigger update of temperature; it might not have changed
              if ( initial_run == 'false' ) {
                //module.exports.realtime(thermostats[id].data,'measure_temperature',temp_new + 4)
                Homey.log ('temperatuur verschil gevonden')
                //module.exports.realtime(device_data,'measure_temperature',temp_new)
                evohomeDebugLog('[updateState]: measure_temperature update: ' + thermostats[id].data.name + ' old: ' + temp_old + ' new: ' + temp_new)
                // the realtime will also trigger the individual device action card
                //evohomeDebugLog('[updatestate]: Triggering flow: ' + thermostats[id].data.name)
                //Homey.log(thermostats[id].data)
                //Homey.log(temp_new)
                //Homey.log('test')
                //module.exports.realtime(thermostats[id].data,'measure_temperature',temp_new + 5)
                //Homey.log('test')
                //Homey.log('thermostat data')
                //Homey.log(thermostats[id].data)
                //Homey.log('thermostat data')
                module.exports.realtime(thermostats[id].data,'measure_temperature',temp_new)
                // this will activate the 'any device changed' action card
                Homey.manager('flow').trigger('any_measure_temp_changed', { "thermostat": thermostats[id].data.name, "temperature": temp_new })
                  }

           }
              // TODO: check of naam veranderd is, zo ja, in Homey aanpassen indien mogelijk
        }
       })
      })
      Homey.log('---Einde updateState-----')
      //devices.push
      callback(null)
    })

  },

deleted: function (device) {
    Homey.log(Object.keys(thermostats).length)
    evohomeDebugLog('delete thermostat: ', device)
    delete thermostats[device.id]
    number_of_devices--
    Homey.log(Object.keys(thermostats).length)
},

pair : function( socket ) {

var settings = Homey.manager('settings').get('evohomeaccount')
  if (settings) {
    var evohomesystem = new Evohomey({
      user: settings.user,
      password: settings.password,
      appid: settings.appid
    })
  }

  socket.on('start', function (data, callback) {
      Homey.log('pairing started')
      if (!settings) {
        Homey.log('no settings')
        return callback('errorNoSettings')
      }
      evohomesystem.validateAccount(function (error, userId) {
      if (error) return callback('errorInvalidSettings')
      Homey.log('pairing: validation complete')
      //Homey.emit('list_devices')
      callback(null)
    })
  }),

  socket.on('list_devices', function (data, callback) {
    if (!settings) {
      Homey.log('no settings')
      return callback('errorNoSettings')
    }
    Homey.log('list devices')
    var rawdata =[]
    evohomesystem.getAllInformation(function(rawdata) {
      //Homey.log('Pairing data:' + rawdata)
      //Homey.log('========')
      //Homey.log(Array.isArray(rawdata))
      //Homey.log(rawdata[0]["devices"])
      //Homey.log(allinformation[0]["devices"])
      var rawdevices = rawdata[0]["devices"]
      devices = []
      //Homey.log(devices)


      Homey.log('++++++++++')

      //Homey.log(rawdevices)
      rawdevices.forEach(function(entry){
        Homey.log(entry["thermostatModelType"])
        if  ((entry["thermostatModelType"]!= 'EMEA_ZONE') && (entry["thermostatModelType"]!= 'EMEA_ROUND_MODULATION')) {
            Homey.log ('no thermostat, skipping')
        } else {
        var device = {
          name: entry["name"],
          data: {
              id: entry["deviceID"],
              name: entry["name"],
              alive: entry["isAlive"],
              temp: Number(entry["thermostat"]["indoorTemperature"].toFixed(2))
          },
          state: {
              measure_temperature: Number(entry["thermostat"]["indoorTemperature"].toFixed(2)),
              target_temperature: Number(entry["thermostat"]["changeableValues"]["heatSetpoint"]["value"].toFixed(2))
          }
        }
        Homey.log('target temp:' + Number(entry["thermostat"]["changeableValues"]["heatSetpoint"]["value"].toFixed(2)))
        //Homey.log(device)
        Homey.log('--------------------------------')
        devices.push(device)
       }
        })
        Homey.log('list devices resultaat: ' + devices)
        callback(null, devices)
    })
  })

  socket.on('add_device', function(device, callback) {
    //.log(devices)
    if (!settings) {
      Homey.log('no settings')
      return callback('errorNoSettings')
    }
    evohomeDebugLog('Added Evohome thermostat: ', device)
    //evohomesystem.updateState(devices,devices,function(callback){
      Homey.log('added device: ' + device)
      number_of_devices++
      thermostats[device.data.id] = {
        data    : {
          id: device.data.id,
          name: device.data.name,
          alive: true,
          temp: device.state.measure_temperature
        },
        state   : {
          measure_temperature: device.state.measure_temperature,
          target_temperature: device.state.target_temperature
        }
      }
      devices[device.data.id] = {
        data    : {
          id: device.data.id,
          name: device.data.name,
          alive: true,
          temp: device.state.measure_temperature
        },
        state   : {
          measure_temperature: device.state.measure_temperature,
          target_temperature: device.state.target_temperature
        }
      }
      Homey.log(thermostats)
      //setTimeout(startMonitoring, 1000)
      // Set initial temperature in logging
      module.exports.realtime(thermostats[device.data.id].data,'measure_temperature',device.state.measure_temperature)
    //})


      callback(null)
  })

  socket.on('disconnect', function(){
    Homey.log("User aborted pairing, or pairing is finished");
  })
},

capabilities : {

    //reset_temperature: {
    //    set: function (device_data, callback){
    //      if( typeof callback == 'function' ) {
    //          Homey.log ('reset capability: ' + device_data)
    //          callback( null )
    //      }
    //    }
    //},
    measure_temperature: {

        // this function is called by Homey when it wants to GET the dim state, e.g. when the user loads the smartphone interface
        // `device_data` is the object as saved during pairing
        // `callback` should return the current value in the format callback( err, value )
        get: function( device_data, callback ){
            // currently, it will not actively retrieve the data, but use the stored data
            var device = thermostats [ device_data.id ]
            if ( typeof device.state.measure_temperature !== 'undefined' ) {
              if (device.state.measure_temperature == '128') {
                evohomeDebugLog ('measure temperature: ' + device_data.id + ' : ' + device_data.name + " : unknown: received 128")
              } else {
                evohomeDebugLog ('measure temperature: ' + device_data.id + ' : ' + device_data.name + " : " + device.state.measure_temperature)
                // send the dim value to Homey
                if( typeof callback == 'function' ) {
                  callback( null, device.state.measure_temperature );
                }
              }

            }
        }
        // this function is called by Homey when it wants to SET the dim state, e.g. when the user says 'red lights'
        // `device_data` is the object as saved during pairing
        // `dim` is the new value
        // `callback` should return the new value in the format callback( err, value )
      },
    target_temperature: {

      get: function( device_data, callback ) {
          Homey.log ('get target temperature')
          Homey.log (device_data)
          var device = thermostats [ device_data.id ]
          //Homey.log ('get target_temperature: ' + device_data.state.target_temperature)
          //var bulb = getBulb( device_data.id );
          //if( bulb instanceof Error ) return callback( bulb );

          //if( bulb.state.dim != dim ) {
          //    bulb.state.dim = dim;
          //    module.exports.realtime( device_data, 'dim', dim);
          //    updateBulb( device_data.id );
          //}

          // send the new dim value to Homey
          if( typeof callback == 'function' ) {
              callback( null, device.state.target_temperature);
          }
      },
        set: function( device_data, target_temperature, callback ) {
          var settings = Homey.manager('settings').get('evohomeaccount')
            if (settings) {
              var evohomesystem = new Evohomey({
                user: settings.user,
                password: settings.password,
                appid: settings.appid
              })
            }
            var device = thermostats [ device_data.id ]
            evohomeDebugLog ('[capabilities] set temperature: ' + device_data.id + ' ' + target_temperature)
            // round to nearest 0.5 degrees (slider sometimes gives values not rounded to 0.5)
            var new_target = Number(Math.round(target_temperature * 2) / 2).toFixed(1)
            //Homey.log (new_target)
            if( typeof callback == 'function' ) {
              evohomesystem.setDeviceTemperature(device_data.id,new_target,function(callback) {
                  //module.exports.realtime(device_data,'target_temperature',temp_new)
                  evohomeDebugLog(device_data.id + ': new target temperature set: ' + new_target)
                  //Homey.log('target setting')
                  //Homey.log(device)
                  //Homey.log('----')
                  //Homey.log(thermostats[device_data.id])
                  //Homey.log('target setting')
                  //module.exports.realtime(device.data,'target_temperature',new_target)
                  //thermostats[device_data.id].state.target_temperature = Number(new_target)
                  //Homey.log(thermostats[device_data.id])
                  //Homey.log('END SET TARGET')
                  callback( null, thermostats[device_data.id].state.target_temperature)
              })

            }
        }
    }
}

}
