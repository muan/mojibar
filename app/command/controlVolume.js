var CommandHandler = require('./commandHandler');
var util = util = require('util');
const osxVol = require('osx-vol');
var displayManager = require('../displayManager')

function ControlVolume() {
    CommandHandler.apply(this, ["volume"]);
}

util.inherits(ControlVolume, CommandHandler);

ControlVolume.prototype.processCommand = function(term) {
  let deferred = $.Deferred();

  osxVol.get().then(level => {
    console.log('Current volume level is '+level*100+'%');
    if (term == "up") {
      level += 0.03;
    } else if (term == "down") {
      level -= 0.03;
    } else {
      deferred.reject("valid command : up down")
      return;
    }

    if (level >= 0 && level <= 1) {
      osxVol.set(level).then(() => {
        displayManager.displayStatusBar('Changed volume level to ' + Math.round(level*100) + ' %');
      });
      deferred.resolve(true)
    } else {
      deferred.reject("volume out of range")
    }
  });

  return deferred.promise();
}

module.exports = ControlVolume;
