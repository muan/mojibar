var emojilib = require('emojilib').lib
var emojikeys = require('emojilib').ordered
var clipboard = require('electron').clipboard
var ipc = require('electron').ipcRenderer
var index = buildIndex()
var indexKeys = Object.keys(index)
var emojikeyIndexTable = buildEmojikeyIndexTable()
var searching = false
var searchInput = document.querySelector('.js-search')
var directions = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down'
}

searchInput.dataset.isSearchInput = true
searchInput.focus()
search('')
searchInput.addEventListener('input', function () {
  search(this.value.toLowerCase())
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
  var onSearchField = !!evt.target.dataset.isSearchInput
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

function stringIncludes (string, search) {
  if (search.length > string.length) {
    return false
  } else {
    return string.indexOf(search) !== -1
  }
}

function search (query) {
  if (searching) {
    clearTimeout(searching)
  }
  searching = setTimeout(function () {
    var results
    if (query.length === 0 || (query.length === 1 && query.charCodeAt() <= 255)) {
      results = emojikeys.slice(0)
    } else {
      var resultsDict = {}
      indexKeys.forEach(function matchQuery (keyword) {
        if (stringIncludes(keyword, query)) {
          index[keyword].forEach(function addMatchingEmoji (emoji) {
            resultsDict[emoji] = true
          })
        }
      })
      results = Object.keys(resultsDict).sort(function sortResults (a, b) {
        return emojikeyIndexTable[a] - emojikeyIndexTable[b]
      })
    }

    // Put exact match first
    if (results.indexOf(query) >= 0) {
      results.splice(results.indexOf(query), 1)
      results.unshift(query)
    }

    renderResults(results, document.querySelector('.js-results'))
    if (document.querySelector('.emoji')) document.querySelector('.emoji').scrollIntoViewIfNeeded()
  }, 80)
}

function renderResults (emojiNameArray, containerElement) {
  containerElement.innerHTML = ''
  var fragment = document.createDocumentFragment()
  emojiNameArray.forEach(function (name) {
    var unicode = (emojilib[name]['char'] || '--')
    var resultElement = document.createElement('button')
    resultElement.type = 'button'
    resultElement.className = 'emoji'
    resultElement.setAttribute('aria-label', name)
    resultElement.textContent = unicode
    fragment.appendChild(resultElement)
  })
  containerElement.appendChild(fragment)
}

function buildEmojikeyIndexTable () {
  var indexTable = {}
  emojikeys.forEach(function (name, index) {
    indexTable[name] = index
  })
  return indexTable
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
