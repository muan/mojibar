var CommandHandler = require('./commandHandler');
var util = util = require('util');
const fs = require('fs');
var open = require('mac-open');

function OpenApp() {
    CommandHandler.apply(this, ["open", true]);
}

util.inherits(OpenApp, CommandHandler);

OpenApp.prototype.processCommand = function(term) {
  let deferred = $.Deferred();

  var re = /(?:\.([^.]+))?$/;
  let path = this.processor.getPath();

  if (fs.lstatSync(path).isDirectory()) {
    open(path, { a: "Atom" }, function(error) {
      if (error) {
        deferred.reject(error);
      } else {
        deferred.resolve(false);
      }
    });
  } else {
    var ext = re.exec(path)[1];

    if (ext == "mp3" || ext == "wav") {
      open(path, { a: "iTunes" }, function(error) {
        if (error) {
          deferred.reject(error);
        } else {
          deferred.resolve(false);
        }
      });
    } else if (ext == "txt") {
      open(path, { a: "TextEdit" }, function(error) {
        if (error) {
          deferred.reject(error);
        } else {
          deferred.resolve(false);
        }
      });
    } else {
      deferred.reject("unable to open " + path);
    }
  }

  return deferred.promise();
}

module.exports = OpenApp;
