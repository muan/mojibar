var CommandHandler = require('./commandHandler');
var util = util = require('util');
var psList = require('ps-list');
var displayManager = require('../displayManager');
var process = require('child_process');

let listTop;

function ListTop() {
  CommandHandler.apply(this, ["top", true]);
  listTop = this;

  this.currentIndex = 0;
  this.procList = [];

  this.port = 8888;
}

function compareCPU(a, b) {
  return b.cpu - a.cpu;
}

util.inherits(ListTop, CommandHandler);

ListTop.prototype.initHandler = function() {
  this.htop = process.exec('gotty -p ' + this.port + ' htop', (error, stdout, stderr) => {
    if (error) {
      console.error(`[listTop] process exec error: ${error}`);
      return;
    }
    // console.log(`[listTop] process stdout : ${stdout}`);
    // console.log(`[listTop] process stderr: ${stderr}`);
  });

  console.log('[listTop] gotty terminal with htop is running (port : ' + this.port + ', pid : ' + this.htop.pid + ')');
}

ListTop.prototype.cleanUpHandler = function() {
  if (this.htop != undefined) {
    console.log('[listTop] terminating gotty terminal with htop (port : ' + this.port + ', pid : ' + this.htop.pid + ')');
    this.htop.kill('SIGHUP');
  }
}

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
    displayManager.displayProcess(this.port);
    deferred.resolve(true);
  }

  // // top
  // if (term == undefined) {
  //   // this.listTop(deferred);
  // } else if (term == "right") {
  //   this.currentIndex = displayManager.updateList(
  //       this.command,
  //       this.procList,
  //       this.currentIndex);
  //   deferred.resolve(true);
  // } else if (term == "left") {
  //   this.currentIndex -= displayManager.listSize * 2;
  //   if (this.currentIndex < 0) this.currentIndex = 0;
  //   this.currentIndex = displayManager.updateList(
  //       this.command,
  //       this.procList,
  //       this.currentIndex);
  //   deferred.resolve(true);
  // } else {
  //   displayManager.displayStatusBar("valid command : right, left");
  //   deferred.resolve(true);
  // }
  return deferred.promise();
}

module.exports = ListTop;
