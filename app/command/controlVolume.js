var CommandHandler = require('./commandHandler');
var util = util = require('util');
const osxVol = require('osx-vol');
var displayManager = require('../displayManager');

function ControlVolume() {
    CommandHandler.apply(this, ["volume", false]);
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
      displayStatusBar.displayStatusBar("valid command : up down");
      deferred.resolve(true);
      return;
    }

    if (level >= 0 && level <= 1) {
      osxVol.set(level).then(() => {
        displayManager.displayStatusBar('Changed volume level to ' + Math.round(level*100) + ' %');
      });
    } else {
      displayStatusBar.displayStatusBar("volume out of range");
    }
    deferred.resolve(true);
  });

  return deferred.promise();
}

module.exports = ControlVolume;
