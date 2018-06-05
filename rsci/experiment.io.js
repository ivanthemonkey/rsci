"use strict";
const debug = require('debug')('RSCI.experiment.io');
var helpers = require('./helpers');

try {

  const Gpio = require('onoff').Gpio;
  var pin_food = new Gpio(2, 'out');
  var pin_drug = new Gpio(3, 'out');
  var pin_buzzer = new Gpio(4, 'out');

  this.resetIO = function (){
    pin_drug.writeSync(0);
    pin_food.writeSync(0);
    pin_buzzer.writeSync(0);
  };

  this.dispenseFood = function () {
    debug('dispenseFood');
    try {
      pin_food.writeSync(1);
      var stop = function (pin) { pin.writeSync(0); } ;
      setTimeout(1000, stop.bind(this,pin_food));
    } catch (e) {
      console.log('IO Error ');
      console.log(e);
    }
  };

  this.dispenseDrug = function () {
    debug('dispenseDrug');
    try {
      pin_drug.writeSync(1);
      var stop = function (pin) { pin.writeSync(0); }.bind(this,pin_drug) ;
      setTimeout(1000, stop.bind(this,pin_drug));
    } catch (e) {
      console.log('IO Error ');
      console.log(e);
    }
  };

  this.dispenseDrug = function () {
    debug('dispenseDrug');
    try {
      pin_buzzer.writeSync(1);
      var stop = function (pin) { pin.writeSync(0); };
      setTimeout(1000, stop.bind(this,pin_buzzer) );
    } catch (e) {
      console.log('IO Error ');
      console.log(e);
    }
  };

  this.resetIO();
  module.exports = this;

} catch (e) {

      console.log('IO Error ');
      console.log('Failed to create io ');
      console.log(e);
      console.log('IO not configured. Using test stubs');

    // test stub
  this.dispenseFood = function () {
    debug('dispenseFood');
    console.log('IO not configured. Using test stubs');
  };
  this.dispenseDrug = function () {
    debug('dispenseDrug');
    console.log('IO not configured. Using test stubs');
  };
  this.resetIO = function (){
    debug('resetIO');
    console.log('IO not configured. Using test stubs');
  }

  module.exports = this;

}



