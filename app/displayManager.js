const visualizer = require('visualizer.js')

const viz = visualizer({
  parent: '#waveform'
})
const listSize = 4;

module.exports.displayAudio = function() {
  $('.results').hide();
  $('#listDiv').hide();
  $('#statusBarDiv').hide();
  $('#waveform').show();
  $('#processDiv').hide();
}

module.exports.displayProcess = function(port) {
  $('.results').hide();
  $('#listDiv').hide();
  $('#statusBarDiv').hide();
  $('#waveform').show();
  $('#processDiv').show();
  $('#processDiv').empty()
  $('#processDiv').html('<object data="http://localhost:'+port+'">');
}

module.exports.displayList = function() {
  $('.results').hide();
  $('#listDiv').show();
  $('#statusBarDiv').hide();
  $('#waveform').hide();
  $('#processDiv').hide();
}

module.exports.updateList = function(heading, items, index) {
  let currentListSize = 0;
  $("#listWrapper").empty();

  let num = Math.ceil(index / listSize) + 1;
  let den = Math.ceil(items.length / listSize)
  $("#listWrapper").append($("<b>").text(heading + " (" + num + "/" + den + ")"));

  while (index < items.length && currentListSize < listSize) {
    $("#listWrapper").append($("<li>").text(items[index]));
    index++;
    currentListSize++;
  }

  if (index < items.length) {
    let remaining = items.length - index;
    $("#listWrapper").append($("<span>").text(remaining + " more exist"));
  } else {
    $("#listWrapper").append($("<span>").text("total size : " + items.length));
  }

  return index;
}

module.exports.displayStatusBar = function(msg) {
  $('.results').hide();
  $('#listDiv').hide();
  $('#statusBarDiv').show();
  $('#waveform').hide();
  $('#processDiv').hide();
  $('#statusBar').text(msg);

  setTimeout(function() {
    displayManager.displayAudio();
  }, 3000)
}

module.exports.updateCommandText = function(text) {
  $('.js-search').val(text)
}

module.exports.listSize = listSize;
