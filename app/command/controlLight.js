var CommandHandler = require('./commandHandler');
var request = require('request');
var util = util = require('util');

let controlLight;

function ControlLight() {
  CommandHandler.apply(this, ["light", false]);
  controlLight = this;

  this.address = 'abc'
  this.clientId = '1028d66426293e821ecfd9ef1a0731df'
  this.lightId = '1'
  this.brightnessMax = 254;
  this.brightness = 0;
}

util.inherits(ControlLight, CommandHandler);

ControlLight.prototype.sendMsg = function(deferred, body) {
  let url = 'https://'+this.address+'/api/'+this.clientId+'/lights/'+this.lightId+'/state'
  // request({
  //   url: url,
  //   method: 'PUT',
  //   body: JSON.stringify({object},
  // function (error, response, body) {
  //   if (error) {
  //     deferred.reject(err);
  //     return;
  //   }
  //   console.log('Upload successful!  Server responded with:', body);
  //   deferred.resolve(true);
  // });
  deferred.resolve(true);
}

ControlLight.prototype.processCommand = function(term) {
  let deferred = $.Deferred();
  if (term == "on") {
    console.log("on")
    this.brightness = this.brightnessMax;
    let body = {"on":true, "bri":this.brightness};
    this.sendMsg(deferred, body);

  } else if (term == "off") {
    console.log("off")
    let body = {"on":false};
    this.sendMsg(deferred, body);

  } else if (term == "up") {
    console.log("up")
    this.brightness += 50;
    if (this.brightness > this.brightnessMax) this.brightness = this.brightnessMax;
    let body = {"on":true, "bri":this.brightness};
    this.sendMsg(deferred, body);

  } else if (term == "down") {
    console.log("down")
    this.brightness -= 50;
    if (this.brightness < 0) this.brightness = 0;
    let body = {"on":true, "bri":this.brightness};
    this.sendMsg(deferred, body);

  } else {
    deferred.reject("valid command : up, down, off, on");
    return;
  }

  return deferred.promise();
}

module.exports = ControlLight;
