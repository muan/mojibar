var emojis = require('emojilib')
var clipboard = require('clipboard')
var ipc = require('ipc')
var index = buildIndex(emojis)
var searchInput = document.querySelector('.js-search')
var directions = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down'
}

// todo
// - fix click/shortcut window positioning

searchInput.focus()
search('')
searchInput.addEventListener('input', function (evt) {
  search(this.value)
})

document.addEventListener('keyup', function (evt) {
  if (evt.target.className.match('js-search') && evt.keyCode === 40) {
    // on down: focus on the first thing!
    jumpto('up')
  } else if (evt.target.className === 'code') {
    if (evt.keyCode === 32) {
      if (evt.shiftKey) {
        jumpto('prev')
      } else {
        jumpto('next')
      }
    } else if (evt.keyCode === 13) {
      var data
      // on enter: copy data and exit
      if (evt.shiftKey) {
        data = evt.target.value
      } else {
        data = evt.target.dataset.char
      }
      clipboard.writeText(data)

      ipc.send('abort')
    } else if (Object.keys(directions).indexOf(evt.keyCode.toString()) >= 0) {
      // on navigation, navigate
      jumpto(directions[evt.keyCode])
    }
  }

  if (!evt.target.className.match('search') && evt.keyCode === 191 && !evt.shiftKey && !evt.metaKey && !evt.ctrlKey) {
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
  if (word && evt.target.className === 'code') {
    searchInput.focus()
    searchInput.value = word
  }
})

function search (query) {
  var results = (Object.keys(index).filter(function matchQuery (keyword) {
    return keyword.match(query)
  })).map(function (keyword) {
    return index[keyword]
  }).join().split(',').filter(function filterUniqueResults (emoji, pos, arr) {
    return emoji && arr.indexOf(emoji) === pos
  }).sort(function sortResults (a, b) {
    return emojis.keys.indexOf(a) - emojis.keys.indexOf(b)
  }).map(function generateMarkup (name) {
    var unicode = (emojis[name]['char'] || '--')
    var result = '<div class="result"><span class="emoji">' + unicode + '</span>'
    result += '<input readonly type="text" data-char="' + unicode + '" class="code" value=":' + name + ':"></div>'
    return result
  }).join('')

  document.querySelector('.js-results').innerHTML = results
  if (document.querySelector('.code')) document.querySelector('.code').scrollIntoViewIfNeeded()
}

function buildIndex (emojis) {
  var keywords = {}
  emojis.keys.forEach(function (name) {
    var words = emojis[name]['keywords']
    words.push(name)
    words.push(emojis[name]['char'])
    words.push(emojis[name]['category'])

    words.forEach(function (word) {
      if (keywords[word] && keywords[word].indexOf(name) < 0) {
        keywords[word].push(name)
      } else if (!keywords[word]) {
        keywords[word] = [name]
      }
    })
  })

  return keywords
}

function isWord (charCode) {
  var word = String.fromCharCode(charCode).match(/\w/)
  return Boolean(word) ? word : false
}

function jumpto (destination) {
  var all = document.getElementsByClassName('code')
  var focusedElement = document.querySelector('.code:focus')
  var nodeIndex = Array.prototype.indexOf.call(all, focusedElement)
  var resultPerRow = 3
  var newTarget

  if (destination === 'up') {
    newTarget = nodeIndex - 3
  } else if (destination === 'down') {
    newTarget = nodeIndex + 3
  } else if (destination === 'left') {
    if ((nodeIndex + 1) % 3 === 1) {
      newTarget = nodeIndex + 2
    } else {
      newTarget = nodeIndex - 1
    }
  } else if (destination === 'right') {
    if ((nodeIndex + 1) % 3 === 0) {
      newTarget = nodeIndex - 2
    } else {
      newTarget = nodeIndex + 1
    }
  } else if (destination === 'next') {
    newTarget = nodeIndex + resultPerRow * 2
  } else if (destination === 'prev') {
    newTarget = nodeIndex - resultPerRow * 2
  }

  if (newTarget < 0) newTarget = 0
  if (newTarget >= all.length - 1) newTarget = all.length - 1
  if (all[newTarget]) {
    all[newTarget].focus()
    all[newTarget].scrollIntoViewIfNeeded()
  }
}
