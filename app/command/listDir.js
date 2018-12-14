const fs = require('fs');
var displayManager = require('../displayManager')

let listDir;

function ListDir() {
  listDir = this;
  this.command = 'list';

  this.listDirPath = {};
  this.listDirPath['music'] = "./sample_audio";
  this.listDirPath['workplace'] = "..";
  this.listDirPath['documents'] = "../../..";
  this.listDirPath['home'] = "../../../..";
}

ListDir.prototype.getCommand = function() {
  return this.command;
}

ListDir.prototype.processCommand = function(term) {
  let deferred = $.Deferred();

  if (term in this.listDirPath) {
    this.currentIndex = 0;
    fs.readdir(this.listDirPath[term], function(err, items) {
      if (err) {
        deferred.reject(err);
        return;
      }
      listDir.fileList = items;
      listDir.currentIndex = displayManager.updateList(listDir.fileList, listDir.currentIndex);
      displayManager.displayList();
      deferred.resolve(true);
    });
  } else if (term == "next") {
    this.currentIndex = displayManager.updateList(this.fileList, this.currentIndex);
    deferred.resolve(true);
  } else if (term == "previous") {
    this.currentIndex -= displayManager.listSize * 2;
    if (this.currentIndex < 0) this.currentIndex = 0;
    this.currentIndex = displayManager.updateList(this.fileList, this.currentIndex);
    deferred.resolve(true);
  } else {
    deferred.reject("invalid command : " + term);
  }

  return deferred.promise();
}

module.exports = ListDir;
