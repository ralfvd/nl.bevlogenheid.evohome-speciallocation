'use strict';

const Homey = require('homey');
var jsonPath = require('jsonpath-plus')
var http = require('http.min')

const POLL_INTERVAL = 1000 * 20 * 1; // 20 seconds

class ThermostatDevice extends Homey.Device {

    // this method is called when the Device is inited
    onInit() {
        let device = this;
        //this.log('device init');
        this.log('device init name:', this.getName());
        //this.log('class:', this.getClass());
        //this.log('capability:', this.getCapabilities());
        //this.log('settings:'), this.getData();
        const { id } = this.getData();
		    //this._id = id;
        //this.log('id:', id);
        var target_old = this.getCapabilityValue('target_temperature')
        //this.log('target_temperature:', target_old)
        var measure_old = this.getCapabilityValue('measure_temperature')
        //this.log('measure_temperature:', measure_old)

        // device will check every POLL_INTERVAL if there have been changes in its state
        this._sync = this._sync.bind(this);
  	    this._syncInterval = setInterval(this._sync, POLL_INTERVAL);


        // Action: target_temperature
        this.registerCapabilityListener('target_temperature', async (value) => {
            this.log('target temperature set requested')
            var target_old = this.getCapabilityValue('target_temperature')
            this.log('old:', target_old)
            this.log('new:', value)
            if (target_old != value) {
              this.log('start target setting', id, value)
              device.setCapabilityValue('target_temperature', value)
              // execute target setting
              // /WebAPI/api/devices/' + deviceID + '/thermostat/changeableValues/heatSetpoint
                var evohomeUser = Homey.ManagerSettings.get('username');
                var evohomePassword= Homey.ManagerSettings.get('password');
                var appid="91db1612-73fd-4500-91b2-e63b069b185c";
                evohomelogin(evohomeUser,evohomePassword,appid).then(function() {
                  console.log('login successfull')
                  var access_token = Homey.ManagerSettings.get('access_token');
                  var locationurl = ('/WebAPI/emea/api/v1/temperatureZone/' + id + '/heatSetpoint');
                  console.log (locationurl , value)
                  var options = {
                    protocol: 'https:',
                    hostname: 'tccna.honeywell.com',
                    path: locationurl,
                    headers: {
                      'Authorization': 'bearer ' + access_token,
                      'Accept': 'application/json, application/xml, text/json, text/x-json, text/javascript, text/xml'
                    },
                    json: true,
                    form: {
                      'HeatSetpointValue': value,
                      'SetpointMode': 1,
                      'TimeUntil': ''
                    }
                  }
                  //console.log(options)
                  http.put(options).then(function (result) {
                    //console.log ('http ', value)
                    //device.setCapabilityValue('target_temperature', parseInt(value),1)
                    // we need to write the new target_temperature into the zone_data file, so it contains the new value (or otherwise _sync will override it)
                    var zone_data = Homey.ManagerSettings.get('zones_read');
                    // rewrite the target_temperature into zone_data and save
                    console.log('+device.js+');
                    console.log(zone_data);
                    console.log('-device.js-');
                    zone_data.forEach(function(item, i) { if (item.zoneId == id) zone_data[i].setpointStatus.targetHeatTemperature = value; });
                    Homey.ManagerSettings.set('zones_read',zone_data)
                    //console.log(result)
                    return Promise.resolve();
                  })
                  .catch(function(reject) {
                    console.log('catch 1')
                    console.log(reject);
                  })
                })
                .catch(function(reject) {
                  console.log('catch 2')
                  console.log(reject);
                })
            }
        })

        //  test

        // Action: target_temperature
        this.registerCapabilityListener('target_temperature_manual', async (value) => {
            this.log('target temperature set requested')
            var target_old = this.getCapabilityValue('target_temperature')
            this.log('old:', target_old)
            this.log('new:', value)
            if (target_old != value) {
              this.log('start target setting', id, value)
              device.setCapabilityValue('target_temperature', value)
              // execute target setting
              // /WebAPI/api/devices/' + deviceID + '/thermostat/changeableValues/heatSetpoint
                var evohomeUser = Homey.ManagerSettings.get('username');
                var evohomePassword= Homey.ManagerSettings.get('password');
                var appid="91db1612-73fd-4500-91b2-e63b069b185c";
                evohomelogin(evohomeUser,evohomePassword,appid).then(function() {
                  console.log('login successfull')
                  var access_token = Homey.ManagerSettings.get('access_token');
                  var locationurl = ('/WebAPI/emea/api/v1/temperatureZone/' + id + '/heatSetpoint');
                  console.log (locationurl , value)
                  var options = {
                    protocol: 'https:',
                    hostname: 'tccna.honeywell.com',
                    path: locationurl,
                    headers: {
                      'Authorization': 'bearer ' + access_token,
                      'Accept': 'application/json, application/xml, text/json, text/x-json, text/javascript, text/xml'
                    },
                    json: true,
                    form: {
                      'HeatSetpointValue': value,
                      'SetpointMode': 1,
                      'TimeUntil': ''
                    }
                  }
                  //console.log(options)
                  http.put(options).then(function (result) {
                    //console.log ('http ', value)
                    //device.setCapabilityValue('target_temperature', parseInt(value),1)
                    // we need to write the new target_temperature into the zone_data file, so it contains the new value (or otherwise _sync will override it)
                    var zone_data = Homey.ManagerSettings.get('zones_read');
                    // rewrite the target_temperature into zone_data and save
                    console.log('+device.js+');
                    console.log(zone_data);
                    console.log('-device.js-');
                    zone_data.forEach(function(item, i) { if (item.zoneId == id) zone_data[i].setpointStatus.targetHeatTemperature = value; });
                    Homey.ManagerSettings.set('zones_read',zone_data)
                    //console.log(result)
                    return Promise.resolve();
                  })
                  .catch(function(reject) {
                    console.log('catch 1')
                    console.log(reject);
                  })
                })
                .catch(function(reject) {
                  console.log('catch 2')
                  console.log(reject);
                })
            }
        })

        // TEST

        // read zone information
        // dit moeten we elke paar minuten draaien

    }

    getID() {
      let device = this;
      //this.log('device init');
      //this.log('device init name:', this.getName());
      //this.log('class:', this.getClass());
      //this.log('capability:', this.getCapabilities());
      //this.log('settings:'), this.getData();
      const { id } = this.getData();
      //this.log (id);
      return id;
    }

    // this method is called when the Device is added
    onAdded() {
        this.log('device added');
    }

    // this method is called when the Device is deleted
    onDeleted() {
      let id = this.getData().id;
      this.log('device deleted: ', id);
      //clearInterval(this._sync.pollingInterval);
      clearInterval(this._syncInterval);
    }

    // capabilities checking
    _sync() {
      const { id } = this.getData();
      //console.log('device.js _sync: ', id);
      let device = this;
      var zone_data = Homey.ManagerSettings.get('zones_read');
      //console.log(zone_data)
      //console.log( 'number of devices in stored zone data: ' , zone_data.length)
      if ( zone_data != 'None' ) {
      //console.log (zone_data);
      zone_data.forEach(function(value){
        if ( value.zoneId == id) {
            //device.log('-- device interval checking for changes --', value.name, value.zoneId, value.temperatureStatus.temperature, value.heatSetpointStatus.targetTemperature );
            // process zone information
            var measure_old = device.getCapabilityValue('measure_temperature')
            if ( measure_old != value.temperatureStatus.temperature) {
              console.log('trigger temperature changecard', measure_old, value.temperatureStatus.temperature)
              device.setCapabilityValue('measure_temperature',value.temperatureStatus.temperature)
              let anytempchange = new Homey.FlowCardTrigger('any_measure_temp_changed');
              let tokens = {
                'thermostat': value.name,
                'temperature': value.temperatureStatus.temperature
              }
              anytempchange
              .register()
              .trigger( tokens )
              .catch( device.error )
              .then( device.log )
                }
            var target_old = device.getCapabilityValue('target_temperature')
            device.setCapabilityValue('target_temperature',value.setpointStatus.targetHeatTemperature)
            // hier nog een trigger bouwen voor target temp change card (new)
        }
      });
     }
    }
}

module.exports = ThermostatDevice;

function token_handling()
{
  return new Promise(function(resolve,reject) {
    var access_token = Homey.ManagerSettings.get('access_token');
    var access_token_expires = Homey.ManagerSettings.get('access_token_expires');
    //console.log(access_token_expires);
    var evohomeUser = Homey.ManagerSettings.get('username');
    var evohomePassword= Homey.ManagerSettings.get('password');
    var appid="91db1612-73fd-4500-91b2-e63b069b185c";
    if ( !evohomeUser || !evohomePassword )
    {
      console.log('reject token handling' ) ; reject ('username settings missing'); return
    }
    else {
      console.log('token handling');
      var currentTime = new Date();
      var expireTime = Date.parse(access_token_expires);
      var difference = expireTime - currentTime;
      //console.log (difference);
      if (difference > 30*1000)
      {
        console.log ('token not yet expired');
        resolve('token not expired')
      }
      else {
        console.log('get new token')
        var options = {
          uri: 'https://tccna.honeywell.com/Auth/OAuth/Token',
          headers: {
//            'Authorization': 'Basic YjAxM2FhMjYtOTcyNC00ZGJkLTg4OTctMDQ4YjlhYWRhMjQ5OnRlc3Q=',
            'Authorization': 'Basic NGEyMzEwODktZDJiNi00MWJkLWE1ZWItMTZhMGE0MjJiOTk5OjFhMTVjZGI4LTQyZGUtNDA3Yi1hZGQwLTA1OWY5MmM1MzBjYg==',
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
            'Username': evohomeUser,
            'Password': evohomePassword,
            'Connection': 'Keep-Alive'
          }
        }
        http.put(options).then(function (data) {
          //var resultaat = JSON.parse(data)
          var access_token = data.data.access_token
          //console.log('Response access token:', data.data.access_token)
          //console.log('Expires:', data.data.expires_in)
          console.log(data.data);
          var timeObject = new Date();
          var timeObject = new Date(timeObject.getTime() + data.data.expires_in*1000);
          Homey.ManagerSettings.set('access_token', data.data.access_token);
          console.log (data.data.access_token);
          console.log (timeObject);
          Homey.ManagerSettings.set('access_token_expires', timeObject);
          //self.access_token = None
          //self.access_token_expires = None
          resolve('new token saved')
        })
        .catch(function(reject) {
          console.log(reject);
          reject('token retrieval failed')
        })
      } // end else
    }
  }) // end Promise
}

function account_handling()
{
  return new Promise(function(resolve,reject) {
  var account_info = Homey.ManagerSettings.get('account_info');
  var access_token = Homey.ManagerSettings.get('access_token');
  if ( !access_token ) { reject ('no token'); return }
  if (account_info == "None") {
    console.log ("get account_info")
    var locationurl = ('/WebAPI/emea/api/v1/userAccount');
    var options = {
      protocol: 'https:',
      hostname: 'tccna.honeywell.com',
      path: locationurl,
      headers: {
        'Authorization': 'bearer ' + access_token,
        'Accept': 'application/json, application/xml, text/json, text/x-json, text/javascript, text/xml'
          }
    }
    //console.log(options);
    http.get(options).then(function (result) {
        //console.log('Location Code: ' + result.response.statusCode)
        //Homey.log('Response: ' + result.data)
            var data = JSON.parse(result.data)
            Homey.ManagerSettings.set('account_info',data.userId);
            console.log('userID: ', data.userId);
            // installation / location
            var installation = Homey.ManagerSettings.get('installation');
            if (installation == "None") {
              console.log ("get location_info")
              var account_info = Homey.ManagerSettings.get('account_info');
              var locationurl = ('/WebAPI/emea/api/v1/location/installationInfo?userId=' + account_info + '&includeTemperatureControlSystems=True');
              var options = {
                protocol: 'https:',
                hostname: 'tccna.honeywell.com',
                path: locationurl,
                headers: {
                  'Authorization': 'bearer ' + access_token,
                  'Accept': 'application/json, application/xml, text/json, text/x-json, text/javascript, text/xml'
                }
              }
              http.get(options).then(function (result) {
                  var data = JSON.parse(result.data)
                  console.log('--- system id check device.js---- ' )
                  console.log(data)
                  //second location
                  var systemId = data[4].gateways[0].temperatureControlSystems[0].systemId;
                  var locationId = data[4].locationInfo.locationId;
                  console.log(result.data);
                  //var locationId =
                  Homey.ManagerSettings.set('systemId',systemId);
                  Homey.ManagerSettings.set('locationId',locationId);
                  resolve('ok')
              })
              .catch(function(reject) {
                console.log(reject);
              })
            } //endif installation == none
      })
    } else  {
      resolve('account handling OK')
    }
  })
}

function evohomelogin(user, password, appid, callback) {
  return new Promise (function (resolve, reject) {
    console.log("evohomey.login")
    var token_handlingPromise = token_handling()
    token_handlingPromise.then(function(result) {
          console.log('token handling OK')
          // hier nu account handling
          var account_handlingPromise = account_handling()
          account_handlingPromise.then(function(result) {
            console.log('account_handling OK')
            resolve('evohomelogin: login OK')
          })
          .catch(function(error) {
            console.log('catch account_handlingPromise', error)
            reject (error)
          })
    })
    .catch(function(error) {
      console.log('catch token_handlingPromise', error)
      reject (error)
    })

  });
}
