var open = require('mac-open');
var youtubeSearch = require('youtube-search');

function SearchYoutube() {
  this.command = 'youtube';
  this.opts = {
    maxResults: 1,
    key: 'AIzaSyDyZMEDTMIb_RmdPjN8wpkXXuBCnHGFBXA'
  };
}

SearchYoutube.prototype.getCommand = function() {
  return this.command;
}

SearchYoutube.prototype.processCommand = function(term) {
  let deferred = $.Deferred();

  youtubeSearch(term, this.opts, function(err, results) {
    // refer https://github.com/MaxGfeller/youtube-search/blob/master/index.js for fields
    if (err) {
      deferred.reject(err);
      return;
    }
    if (results.length > 0) {
      open(results[0].link);
      deferred.resolve(false);
    } else {
      deferred.reject("No result found");
    }
  });

  return deferred.promise();
}

module.exports = SearchYoutube;
