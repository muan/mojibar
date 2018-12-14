const visualizer = require('visualizer.js')

const viz = visualizer({
  parent: '#waveform'
})
const listSize = 6;

module.exports.displayAudio = function() {
  $('.results').hide();
  $('#listDiv').hide();
  $('#statusBarWrapper').hide();
  $('#waveform').show();
}

module.exports.displayList = function() {
  $('.results').hide();
  $('#listDiv').show();
  $('#statusBarWrapper').hide();
  $('#waveform').hide();
}

module.exports.updateList = function(items, index) {
  let currentListSize = 0;
  $("#listWrapper").empty();

  while (index < items.length && currentListSize < listSize) {
    $("#listWrapper").append($("<li>").text(items[index]));
    index++;
    currentListSize++;
  }

  if (index < items.length) {
    let remaining = items.length - index;
    $("#listWrapper").append($("<span>").text(remaining + " more files exist"));
  } else {
    $("#listWrapper").append($("<span>").text("total of " + items.length + " files"));
  }

  return index;
}

module.exports.displayStatusBar = function(msg) {
  $('.results').hide();
  $('#listDiv').hide();
  $('#statusBarWrapper').show();
  $('#waveform').hide();
  $('#statusBar').text(msg);

  setTimeout(function() {
    displayManager.displayAudio();
  }, 3000)
}

module.exports.updateCommandText = function(text) {
  $('.js-search').val(text)
}

module.exports.listSize = 6;
