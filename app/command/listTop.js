var CommandHandler = require('./commandHandler');
var util = util = require('util');
var psList = require('ps-list');
var displayManager = require('../displayManager')

let listTop;

function ListTop() {
  CommandHandler.apply(this, ["top", true]);
  listTop = this;

  this.currentIndex = 0;
  this.procList = [];
}

function compareCPU(a, b) {
  return b.cpu - a.cpu;
}

util.inherits(ListTop, CommandHandler);

ListTop.prototype.listTop = function(deferred) {
  this.currentIndex = 0;
  psList().then(data => {
    let sorted = data.sort(compareCPU);
    listTop.procList = sorted.map(proc => proc.name + " - " + proc.cpu + " %")
    listTop.currentIndex = displayManager.updateList(
        listTop.command,
        listTop.procList,
        listTop.currentIndex);
    displayManager.displayList();
    deferred.resolve(true);
  });
}

ListTop.prototype.processCommand = function(term) {
  let deferred = $.Deferred();
  if (term == undefined) {
    this.listTop(deferred)
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

module.exports = ListTop;
