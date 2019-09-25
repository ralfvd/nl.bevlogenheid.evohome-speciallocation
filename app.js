"use strict";
const Homey = require('homey');
var jsonPath = require('jsonpath-plus')
var http = require('http.min')
var evohomey = require('./lib/evohomey.js')
var login = require('./lib/login.js')
//var moment = require('./lib/moments.js');

class Evohome extends Homey.App {

  onInit() {
    this.log("Evohome app started");
    Homey.ManagerSettings.set('account_info','None');
    Homey.ManagerSettings.set('installation','None');
    Homey.ManagerSettings.set('zones_read','None');
    Homey.ManagerSettings.set('access_token_expires',Date()); // make sure new is used at start-up


// register qa-status-token
let QA_Token_loc2 = new Homey.FlowToken( 'evohome_qa_status', {
  type: 'string',
  title: 'Evohome quickaction'
});
QA_Token_loc2.register()
  .then(() => {
    return QA_Token_loc2.setValue( 'not available' );
  })
  .catch( err => {
    this.error( err );
  });

// set_quickaction

let set_quickaction = new Homey.FlowCardAction('set_quickaction');
set_quickaction
    .register()
    .registerRunListener(( args, state ) => {
        this.log(args['qa'])
        let qa_set = evohomey.quickaction_set(args['qa'],'True',''); // true or false
        Homey.ManagerSettings.set('quickAction',args['qa']);
        QA_Token_loc2.setValue( args['qa'] );
        return Promise.resolve( qa_set );

    })

// set_quickaction

let set_temporary_quickaction = new Homey.FlowCardAction('set_temporary_quickaction');
set_temporary_quickaction
      .register()
        .registerRunListener(( args, state ) => {
            this.log(args['qa'])
            const tmpTime = new Date();
            tmpTime.setHours(tmpTime.getHours() + args['temp_hours']);
            tmpTime.setSeconds(0,0);
            this.log(args['temp_hours']);
            this.log(tmpTime.toISOString().replace(/\.\d+Z/,'Z'));

            //this.log(args['qa_date']);
            //this.log(args['qa_time']);
            //var TimezoneDate = new Date().getTimezoneOffset()
            //this.log(TimezoneDate);
            let qa_temp_set = evohomey.quickaction_set(args['qa'],'False',tmpTime.toISOString().replace(/\.\d+Z/,'Z')); // true or false
            Homey.ManagerSettings.set('quickAction',args['qa']);
            QA_Token_loc2.setValue( args['qa'] );
            //return Promise.resolve( qa_temp_set );
            return Promise.resolve (' TMP ok');
        })

// set_quickaction_manual_entry

let set_quickaction_manual_entry = new Homey.FlowCardAction('set_quickaction_manual_entry');
set_quickaction_manual_entry
    .register()
    .registerRunListener(( args, state ) => {
        this.log('quickaction manual entry')
        this.log(args['qa'])
        switch(args['qa']) {
            case "HeatingOff":
            case "Auto":
            case "AutoWithEco":
            case "Away":
            case "Custom":
            case "DayOff":
              let qa_set = evohomey.quickaction_set(args['qa'],'True',''); // true or false
              Homey.ManagerSettings.set('quickAction',args['qa']);
              return Promise.resolve( qa_set );
                break
              default:
                return Promise.reject ('invalidSettings')
            }
    })

// set_temperature_manual (device)

let set_temperature_manual = new Homey.FlowCardAction('set_temperature_manual');
set_temperature_manual
    .register()
    .registerRunListener(( args, state ) => {
        this.log('temperature manual entry')
        var id = args.device.getID();
        this.log(id);
        let temp_set = evohomey.temperature_set(id,args['temp_manual'],1)
        return Promise.resolve( 'temp_set' );
    })

// set_temperature_temporary (device)

  let set_temperature_temporary = new Homey.FlowCardAction('set_temperature_temporary');
    set_temperature_temporary
        .register()
        .registerRunListener(( args, state ) => {
            this.log('temperature temporary manual entry')
            var id = args.device.getID();
            this.log(id);
            const tmpTime = new Date();
            this.log(tmpTime);
            tmpTime.setHours(tmpTime.getHours() + args['temp_hours']);
            tmpTime.setSeconds(0,0);
            this.log(args['temp_hours']);
            this.log(tmpTime.toISOString().replace(/\.\d+Z/,'Z'));
            var setcode = "TemporaryOverride";
            let temp_set = evohomey.temperature_set(id,args['temp_manual'],setcode,tmpTime.toISOString().replace(/\.\d+Z/,'Z'))
            return Promise.resolve( 'temp_temorary_set' );
        })

// reset_temperature (device)

let reset_temperature = new Homey.FlowCardAction('reset_temperature');
reset_temperature
    .register()
    .registerRunListener(( args, state ) => {
        this.log('temperature reset')
        var id = args.device.getID();
        this.log(id);
        let temp_reset = evohomey.temperature_set(id,'',0)
        return Promise.resolve( 'temp_reset' );
    })

    // reset_all_zones (device)

    let reset_all_zones = new Homey.FlowCardAction('reset_all_zones');
    reset_all_zones
        .register()
        .registerRunListener(( args, state ) => {
            this.log('reset all zones');
            // first we need a list of all IDs
            var zonePromise = evohomey.zones_read();
            zonePromise.then(function(result) {
              var data = result;
              console.log('test')
              data.forEach(function(value){
                console.log('+++reset all temp: +++')
                //console.log(value)
                //console.log('--')
                //console.log(value.zoneId);
                //console.log(value.setpointStatus.setpointMode)
                if (value.setpointStatus.setpointMode != 'FollowSchedule') {
                  console.log(' cancel needed for: ', value.zoneId);
                  let temp_reset = evohomey.temperature_set(value.zoneId,'',0,'')
                }
              })
              return Promise.resolve( 'ok' );
            })
            .catch('catch reset_all_zones');
            return Promise.resolve( 'ok' );
        })

 //// MAIN

 console.log('-----')
 //console.log(userid);

 // first, some checks and logging to timeline is something is not right
 var evohomeUser = Homey.ManagerSettings.get('username');
 var evohomePassword= Homey.ManagerSettings.get('password');
 if ( !evohomeUser || !evohomePassword ) {
   new Homey.Notification({excerpt:'Evohome 3rd location: missing username or password; enter your Honeywell credentials in app settings'}) // username + password set?
       .register();

 } else {
   // login correct ?
   var appid="91db1612-73fd-4500-91b2-e63b069b185c";
   var evohomeloginPromise = login.evohomelogin(evohomeUser,evohomePassword,appid);
   evohomeloginPromise.then(function(result) {
     console.log ('app start login check: login successfull')
    })
    .catch(function(reject) {
      console.log('app start: login failed: ', reject);
      new Homey.Notification({excerpt:'Evohome 3rd: invalid username or password; please adjust in app settings and restart app'}) // username + password set?
          .register();
    })
 }
 // all checks completed


 // uncomment after checks complete
 regular_update(); // kick-off during start-up
 setInterval(regular_update,5 * 60 * 1000);
 function regular_update() {
    console.log('5 minute update routine')
    // 1 - quickaction status uitlezen
    console.log('quickaction read')
    var quickactionPromise  = evohomey.quickaction_read();
    quickactionPromise.then(function(result) {
      var qa_new = result;
      console.log('QA retrieved: ', qa_new);
      var qa_old = Homey.ManagerSettings.get('qa')
      console.log('QA Stored: ',qa_old);
      QA_Token_loc2.setValue( qa_new );
      if (qa_old != qa_new) {
        // Trigger quickaction_changed_externally
        console.log ('quickaction changed')
        Homey.ManagerSettings.set('qa',qa_new);
        let quickaction_changed_externally = new Homey.FlowCardTrigger('quickaction_changed_externally');
        let tokens = {
          'qa_name': qa_new
        }
        quickaction_changed_externally
        .register()
        .trigger(tokens)
          .catch('qa changed externally catch')
          .then(console.log('new qa set'))
      }
      // 2 - zone status uitlezen
      console.log('zone status read')
      var zonePromise = evohomey.zones_read();
      zonePromise.then(function(result) {
        var data = result;
        console.log('hier gebeurt niets volgens mij');
        //Homey.ManagerSettings.set('zones_read','test');
        // hier dingen uitvoeren
      })
    });

} // 5 minute update

 //// END MAIN
  } // end oninit
}

module.exports = Evohome;
