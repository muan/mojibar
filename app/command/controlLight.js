var CommandHandler = require('./commandHandler');
var request = require('request');
var util = util = require('util');

let controlLight;

function ControlLight() {
  CommandHandler.apply(this, ["light", false]);
  controlLight = this;

  this.address = '192.168.1.58'
  this.clientId = 'q5cjwgsDC-Y19iY0DDQ9wL8mUibNLWNJ6QZiARAQ'
  this.lightId = '1'
  this.brightnessMax = 254;
  this.brightness = 1;
}

util.inherits(ControlLight, CommandHandler);

ControlLight.prototype.sendMsg = function(deferred, body) {
  let url = 'https://'+this.address+'/api/'+this.clientId+'/lights/'+this.lightId+'/state';
  console.log(url)
  request({
    url: url,
    method: 'PUT',
    rejectUnauthorized: false,
    body: JSON.stringify(body)
  }, function (error, response, body) {
    if (error) {
      displayStatusBar.displayStatusBar(error);
    }
    deferred.resolve(true);
  });
}

ControlLight.prototype.processCommand = function(term) {
  let deferred = $.Deferred();
  if (term == "on") {
    this.brightness = this.brightnessMax;
    let body = {"on":true, "bri":this.brightness-100};
    this.sendMsg(deferred, body);

  } else if (term == "off") {
    let body = {"on":false};
    this.sendMsg(deferred, body);

  } else if (term == "up") {
    this.brightness += 50;
    if (this.brightness > this.brightnessMax) this.brightness = this.brightnessMax;
    let body = {"on":true, "bri":this.brightness};
    this.sendMsg(deferred, body);

  } else if (term == "down") {
    this.brightness -= 50;
    if (this.brightness < 1) this.brightness = 1;
    let body = {"on":true, "bri":this.brightness};
    this.sendMsg(deferred, body);

  } else {
    displayStatusBar.displayStatusBar("valid command : up, down, off, on");
    deferred.resolve(true);
  }

  return deferred.promise();
}

module.exports = ControlLight;
