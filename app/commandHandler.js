var ipc = require('electron').ipcRenderer
var displayManager = require('./displayManager')
var SearchYoutube = require('./command/searchYoutube')
var SearchGoogle = require('./command/searchGoogle')
var SearchWikipedia = require('./command/searchWikipedia')
var ControlVolume = require('./command/controlVolume')
var ListDir = require('./command/listDir')

let commandHandler;

function CommandHandler() {
  commandHandler = this;

  this.inputCommand = '';
  this.commandSet = [];
  this.handlerMap = {};

  function registerHandler(handler) {
    let command = handler.getCommand();
    commandHandler.commandSet.push(command);
    commandHandler.handlerMap[command] = handler;
  }

  registerHandler(new SearchYoutube());
  registerHandler(new SearchGoogle());
  registerHandler(new SearchWikipedia());
  registerHandler(new ControlVolume());
  registerHandler(new ListDir());

  console.log("Registered Commands - " + this.commandSet)
}

CommandHandler.prototype.resetStatus = function() {
  this.inputCommand = ''
  displayManager.updateCommandText('')
  ipc.send('abort');
}

CommandHandler.prototype.handleCommand = function(input) {
  if (input == "bye") {
    this.resetStatus();
  } else if (this.commandSet.includes(input)) {
    this.inputCommand = input
    displayManager.updateCommandText(input)
  } else if (this.inputCommand != '') {
    displayManager.updateCommandText(this.inputCommand + ' ' + input);

    let promise = this.handlerMap[this.inputCommand].processCommand(input);

    promise.done(function(keep) {
      if (keep) {
        displayManager.updateCommandText(commandHandler.inputCommand)
      } else {
        commandHandler.resetStatus();
      }
    }).fail(function(msg) {
      displayManager.displayStatusBar(msg);
      setTimeout(function() {
        commandHandler.resetStatus();
      }, 3000)
    })
  }
}

module.exports = CommandHandler;
