var open = require('mac-open');

function SearchWikipedia() {
  this.command = 'wikipedia';
}

SearchWikipedia.prototype.getCommand = function() {
  return this.command;
}

SearchWikipedia.prototype.processCommand = function(term) {
  let deferred = $.Deferred();
  open('https://en.wikipedia.org/wiki/' + term);
  deferred.resolve(false);
  return deferred.promise();
}

module.exports = SearchWikipedia;
