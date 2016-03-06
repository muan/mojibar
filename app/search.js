var emojilib = require('emojilib').lib
var emojikeys = require('emojilib').ordered
var clipboard = require('clipboard')
var ipc = require('electron').ipcRenderer
var index = buildIndex()
var searching = false
var searchInput = document.querySelector('.js-search')
var directions = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down'
}

searchInput.focus()
search('')
searchInput.addEventListener('input', function () {
  search(this.value)
})

ipc.on('show', function (event, message) {
  searchInput.focus()
})

document.addEventListener('mousewheel', function (e) {
  if (e.deltaY % 1 !== 0) {
    e.preventDefault()
  }
})

document.addEventListener('keydown', function (evt) {
  var onSearchField = evt.target.className.match('js-search')
  if (onSearchField) {
    if (evt.keyCode === 40) {
      // on down: focus on the first thing!
      jumpto('up')
      evt.preventDefault()
    } else if (evt.keyCode === 13) {
      copyFocusedEmoji(document.querySelector('.emoji:first-child'), evt.shiftKey)
    }
  } else if (evt.target.classList.contains('emoji')) {
    if (evt.keyCode === 32) {
      if (evt.shiftKey) {
        jumpto('prev')
      } else {
        jumpto('next')
      }
    } else if (evt.keyCode === 13) {
      copyFocusedEmoji(evt.target, evt.shiftKey)
    } else if (Object.keys(directions).indexOf(evt.keyCode.toString()) >= 0) {
      // on navigation, navigate
      jumpto(directions[evt.keyCode])
    }
  }

  if (!onSearchField && evt.keyCode === 191 && !evt.shiftKey && !evt.metaKey && !evt.ctrlKey) {
    // on `/`: focus on the search field
    searchInput.select()
    evt.preventDefault()
  } else if (evt.keyCode === 27) {
    // on escape: exit
    ipc.send('abort')
  }
})

function copyFocusedEmoji (emoji, copyText) {
  var data
  // on enter: copy data and exit
  if (copyText) {
    data = ':' + emoji.getAttribute('aria-label') + ':'
  } else {
    data = emoji.innerText
  }
  clipboard.writeText(data)
  searchInput.value = ''
  search('')
  ipc.send('abort')
}

document.addEventListener('keypress', function (evt) {
  // if typing while navigatin, just type into the search box!
  var word = isWord(evt.charCode)
  if (word && evt.target.classList.contains('emoji')) {
    searchInput.focus()
  }
})

function search (query) {
  if (searching) {
    clearTimeout(searching)
  }
  searching = setTimeout(function () {
    var results
    if (query.length === 0 || (query.length === 1 && query.charCodeAt() <= 255)) {
      results = emojikeys.slice(0)
    } else {
      results = (Object.keys(index).filter(function matchQuery (keyword) {
        return keyword.match(query)
      })).map(function (keyword) {
        return index[keyword]
      }).join().split(',').filter(function filterUniqueResults (emoji, pos, arr) {
        return emoji && arr.indexOf(emoji) === pos
      }).sort(function sortResults (a, b) {
        return emojikeys.indexOf(a) - emojikeys.indexOf(b)
      })
    }

    // Put exact match first
    if (results.indexOf(query) >= 0) {
      results.splice(results.indexOf(query), 1)
      results.unshift(query)
    }

    document.querySelector('.js-results').innerHTML = generateMarkup(results)
    if (document.querySelector('.emoji')) document.querySelector('.emoji').scrollIntoViewIfNeeded()
  }, 100)
}

function generateMarkup (emojiNameArray) {
  return emojiNameArray.map(function (name) {
    var unicode = (emojilib[name]['char'] || '--')
    var result = '<button type="button" class="emoji" aria-label="' + name + '">' + unicode + '</button>'
    return result
  }).join('')
}

function buildIndex () {
  var keywords = {}
  emojikeys.forEach(function (name) {
    var words = emojilib[name]['keywords']
    words.push(name)
    words.push(emojilib[name]['char'])
    words.push(emojilib[name]['category'])

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
  var container = document.getElementsByClassName('js-results')[0]
  var all = document.getElementsByClassName('emoji')
  var focusedElement = document.querySelector('.emoji:focus')
  var nodeIndex = Array.prototype.indexOf.call(all, focusedElement)
  var resultPerRow = Number((container.clientWidth / all[0].clientWidth).toFixed())
  var resultPerCol = Number((container.clientHeight / all[0].clientHeight).toFixed())
  var newTarget

  if (destination === 'up') {
    newTarget = nodeIndex - resultPerRow
  } else if (destination === 'down') {
    newTarget = nodeIndex + resultPerRow
  } else if (destination === 'left') {
    if ((nodeIndex + 1) % resultPerRow === 1) {
      newTarget = nodeIndex + (resultPerRow - 1)
    } else {
      newTarget = nodeIndex - 1
    }
  } else if (destination === 'right') {
    if ((nodeIndex + 1) % resultPerRow === 0) {
      newTarget = nodeIndex - (resultPerRow - 1)
    } else {
      newTarget = nodeIndex + 1
    }
  } else if (destination === 'next') {
    newTarget = nodeIndex + resultPerRow * (resultPerCol - 1 || 1)
  } else if (destination === 'prev') {
    newTarget = nodeIndex - resultPerRow * (resultPerCol - 1 || 1)
  }

  if (newTarget < 0) newTarget = 0
  if (newTarget >= all.length - 1) newTarget = all.length - 1
  if (all[newTarget]) {
    all[newTarget].focus()
    all[newTarget].scrollIntoViewIfNeeded()
  }
}
