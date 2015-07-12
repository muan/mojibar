var emojis = require('emojilib')
var clipboard = require('clipboard')
var ipc = require('ipc')
var index = buildIndex(emojis)
var searchInput = document.querySelector('.js-search')
var directions = {
  37: "left",
  38: "up",
  39: "right",
  40: "down"
}

// todo
// - pagination?

searchInput.focus()
searchInput.addEventListener('input', function (evt) {
  search(this.value)
})

document.addEventListener('keyup', function (evt) {
  if (evt.target.className.match("js-search") && evt.keyCode === 40) {
    // on down: focus on the first thing!
    jumpto('up')
  } else if (evt.target.className === "code") {
    if (evt.keyCode === 13) {
      // on enter: copy data and exit
      if (evt.shiftKey) {
        var data = evt.target.dataset.char
      } else {
        var data = evt.target.value
      }
      clipboard.writeText(data)

      ipc.send('abort')
    } else if (Object.keys(directions).indexOf(evt.keyCode.toString()) >= 0) {
      // on navigation, navigate
      jumpto(directions[evt.keyCode])
    }
  } else if (evt.keyCode === 191) {
    // on `/`: focus on the search field
    searchInput.select()
  } else if (evt.keyCode === 27) {
    // on escape: exit
    ipc.send('abort')
  }
})

document.addEventListener('keypress', function (evt) {
  // if typing while navigatin, just type into the search box!
  var word = isWord(evt.charCode)
  if (word && evt.target.className === "code") {
    searchInput.focus()
    searchInput.value = word
  }
})

function search (query) {
  var results = (Object.keys(index).filter(function matchQuery (keyword) {
    return keyword.match(query)
  })).map(function(keyword) {
    return index[keyword]
  }).join().split(',').filter(function filterUniqueResults (emoji, pos, arr) {
    return emoji && arr.indexOf(emoji) === pos
  }).map(function generateMarkup (name) {
    var unicode = (emojis[name]['char'] || '--')
    var result = '<div class="result"><span class="emoji">' + unicode + '</span>'
    result += '<input readonly type="text" data-char="' + unicode + '" class="code" value=":' + name + ':"></div>'
    return result
  }).join('')

  document.querySelector('.js-outcome').innerHTML = results
}

function buildIndex (emojis) {
  var keywords = {}
  Object.keys(emojis).map(function (name) {
    var words = emojis[name]["keywords"]
    words.push(name)
    words.push(emojis[name]["category"])

    words.forEach(function(word) {
      if (keywords[word] && keywords[word].indexOf(name) < 0) {
        keywords[word].push(name)
      } else {
        keywords[word] = [name]
      }
    })
  })
  return keywords
}

function isWord (charCode) {
  var word = String.fromCharCode(charCode).match(/\w/)
  return !!word ? word : false
}

function jumpto (direction) {
  var all = document.getElementsByClassName('code')
  var focusedElement = document.querySelector('.code:focus')
  var nodeIndex = Array.prototype.indexOf.call(all, focusedElement)
  var resultPerRow = 3

  if (direction === 'up') {
    var newTarget = nodeIndex - 3
  } else if (direction === 'down') {
    var newTarget = nodeIndex + 3
  } else if (direction === 'left') {
    if ((nodeIndex+1)%3 === 1) {
      var newTarget = nodeIndex + 2
    } else {
      var newTarget = nodeIndex - 1
    }
  } else if (direction === 'right') {
    if ((nodeIndex+1)%3 === 0) {
      var newTarget = nodeIndex - 2
    } else {
      var newTarget = nodeIndex + 1
    }
  }

  if (newTarget < 0) newTarget = 0
  if (newTarget >= all.length - 1) newTarget = all.length - 1
  if (all[newTarget]) all[newTarget].focus()
}
