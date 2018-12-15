var ipc = require('electron').ipcRenderer
var displayManager = require('./displayManager')
var SearchYoutube = require('./command/searchYoutube')
var SearchGoogle = require('./command/searchGoogle')
var SearchWikipedia = require('./command/searchWikipedia')
var ControlVolume = require('./command/controlVolume')
var ListDir = require('./command/listDir')

let commandProcessor;

function CommandProcessor() {
  commandProcessor = this;

  this.inputCommand = '';
  this.commandSet = [];
  this.handlerMap = {};
  this.path = '';

  function registerHandler(handler) {
    let command = handler.getCommand();
    commandProcessor.commandSet.push(command);
    commandProcessor.handlerMap[command] = handler;
    handler.registerProcessor(commandProcessor);
  }

  registerHandler(new SearchYoutube());
  registerHandler(new SearchGoogle());
  registerHandler(new SearchWikipedia());
  registerHandler(new ControlVolume());
  registerHandler(new ListDir());

  console.log("Registered Commands - " + this.commandSet)
}

CommandProcessor.prototype.resetStatus = function() {
  this.inputCommand = ''
  displayManager.updateCommandText('')
  ipc.send('abort');
}

CommandProcessor.prototype.handleCommand = function(input) {
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
        displayManager.updateCommandText(commandProcessor.inputCommand)
      } else {
        commandProcessor.resetStatus();
      }
    }).fail(function(msg) {
      displayManager.displayStatusBar(msg);
      setTimeout(function() {
        commandProcessor.resetStatus();
      }, 3000)
    })
  }
}

CommandProcessor.prototype.appendPath = function(folder) {
  this.path = this.path + "/" + folder;
}

CommandProcessor.prototype.setPath = function(path) {
  this.path = path;
}

CommandProcessor.prototype.getPath = function() {
  return this.path;
}

module.exports = CommandProcessor;
