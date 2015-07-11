var emojis = require('emojilib')
var clipboard = require('clipboard')
var ipc = require('ipc')
var index = buildIndex(emojis)
var searchInput = document.querySelector('.js-search')

// todo
// - up/down/left/right key navigation
// - pagination?

searchInput.focus()
searchInput.addEventListener('input', function (evt) {
  search(this.value)
})

document.addEventListener('keyup', function (evt) {
  if (evt.keyCode === 13 && evt.target.className === "code") {
    // on enter: copy data and exit
    if (evt.shiftKey) {
      var data = evt.target.dataset.char
    } else {
      var data = evt.target.value
    }
    clipboard.writeText(data)

    ipc.send('abort')
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
  document.querySelector('.js-outcome').innerHTML =

  (Object.keys(index).filter(function matchQuery (keyword) {
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
}

function buildIndex (emojis) {
  var keywords = {}
  Object.keys(emojis).map(function (name) {
    var words = emojis[name]["keywords"]
    words.push(name)

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