var open = require('mac-open');

function SearchGoogle() {
  this.command = 'google';
}

SearchGoogle.prototype.getCommand = function() {
  return this.command;
}

SearchGoogle.prototype.processCommand = function(term) {
  let deferred = $.Deferred();
  open('https://www.google.ca/search?q=' + term);
  deferred.resolve(false);
  return deferred.promise();
}

module.exports = SearchGoogle;
