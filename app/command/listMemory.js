var CommandHandler = require('./commandHandler');
var util = util = require('util');
var psList = require('ps-list');
var displayManager = require('../displayManager')

let listMemory;

function ListMemory() {
  CommandHandler.apply(this, ["memory", true]);
  listMemory = this;

  this.currentIndex = 0;
  this.procList = [];
}

function compareCPU(a, b) {
  return b.memory - a.memory;
}

util.inherits(ListMemory, CommandHandler);

ListMemory.prototype.listMemory = function(deferred) {
  this.currentIndex = 0;
  psList().then(data => {
    let sorted = data.sort(compareCPU);
    listMemory.procList = sorted.map(proc => proc.name + " - " + proc.memory + " %")
    listMemory.currentIndex = displayManager.updateList(
        listMemory.command,
        listMemory.procList,
        listMemory.currentIndex);
    displayManager.displayList();
    deferred.resolve(true);
  });
}

ListMemory.prototype.processCommand = function(term) {
  let deferred = $.Deferred();
  if (term == undefined) {
    this.listMemory(deferred)
  } else if (term == "right") {
    this.currentIndex = displayManager.updateList(
        this.command,
        this.procList,
        this.currentIndex);
    deferred.resolve(true);
  } else if (term == "left") {
    this.currentIndex -= displayManager.listSize * 2;
    if (this.currentIndex < 0) this.currentIndex = 0;
    this.currentIndex = displayManager.updateList(
        this.command,
        this.procList,
        this.currentIndex);
    deferred.resolve(true);
  } else {
    deferred.reject("valid command : right, left");
  }
  return deferred.promise();
}

module.exports = ListMemory;
