var CommandHandler = require('./commandHandler');
var util = util = require('util');
var open = require('mac-open');

function SearchGoogle() {
    CommandHandler.apply(this, ["google", false]);
}

util.inherits(SearchGoogle, CommandHandler);

SearchGoogle.prototype.processCommand = function(term) {
  let deferred = $.Deferred();
  open('https://www.google.ca/search?q=' + term);
  deferred.resolve(false);
  return deferred.promise();
}

module.exports = SearchGoogle;
