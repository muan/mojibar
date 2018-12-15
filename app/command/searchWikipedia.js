var CommandHandler = require('./commandHandler');
var util = util = require('util');
var open = require('mac-open');

function SearchWikipedia() {
    CommandHandler.apply(this, ["wikipedia", false]);
}

util.inherits(SearchWikipedia, CommandHandler);

SearchWikipedia.prototype.processCommand = function(term) {
  let deferred = $.Deferred();
  open('https://en.wikipedia.org/wiki/' + term);
  deferred.resolve(false);
  return deferred.promise();
}

module.exports = SearchWikipedia;
