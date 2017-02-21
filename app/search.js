var emojilib = require('emojilib').lib
var emojikeys = require('emojilib').ordered
var clipboard = require('electron').clipboard
var ipc = require('electron').ipcRenderer
var wordwrap = require('wordwrap')
var index = buildIndex()
var indexKeys = Object.keys(index)
var emojikeyIndexTable = buildEmojikeyIndexTable()
var searching = false
var searchInput = document.querySelector('.js-search')
var containerElement = document.querySelector('.js-results')
var directions = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down'
}


// Initialize container now. Further results are simply filtered via calls to search().
containerElement.innerHTML = ''
var fragment = document.createDocumentFragment()
for(let i in emojikeys) {
  let name = emojikeys[i]
  let unicode = (emojilib[name]['char'] || '--')
  let resultElement = document.createElement('button')
  resultElement.type = 'button'
  resultElement.className = 'emoji'
  resultElement.id = name
  resultElement.setAttribute('aria-label', name)

  // For consistent retrieval, if no image could be parsed/generated.
  resultElement.setAttribute('data-char', unicode)

  // Parse the Twitter version of this emoji.
  resultElement.innerHTML = twemoji.parse(unicode, function(icon) {
    return '../node_modules/twemoji/2/svg/' + icon + '.svg'
  })

  // Setup title for mouse over to provide hints about what keywords trigger this emoji.
  let keywords = emojilib[name].keywords.filter(function(val) {
      return val != unicode
  });
  let title = ':' + name + ':\n\n(' + keywords.join(', ') + ')'
  resultElement.title = wordwrap(50)(title)

  fragment.appendChild(resultElement)
}
containerElement.appendChild(fragment)

// Init search.
searchInput.dataset.isSearchInput = true
searchInput.focus()
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

function copyFocusedEmoji (targetElement, copyText) {
  var data

  // Since focused target could be an image, retarget the parent button.
  button = targetElement
  if (targetElement.tagName == 'IMG') {
    button = targetElement.parentNode
  }

  // on enter: copy data and exit
  data = button.getAttribute('data-char')
  if (copyText || data == '--') {
	data = ':' + button.getAttribute('aria-label') + ':'
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

// if click on and emoji item, copy emoji unicode char to clipboard on click or
// copy emoji code if `shiftKey` is pressed
document.addEventListener('click', function (evt) {
  if (evt.target.classList.contains('emoji')) {
    copyFocusedEmoji(evt.target, evt.shiftKey)
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

    renderResults(results)
    if (document.querySelector('button:not(.hide)')) document.querySelector('button:not(.hide)').scrollIntoViewIfNeeded()
  }, 80)
}

function renderResults (emojiNameArray) {
  // Already initialized, just hide all and show only matches.
  let all = document.querySelectorAll('button')
  all.forEach(function(button) {
    button.classList.toggle('hide', emojiNameArray.indexOf(button.id) === -1)
  })
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
  var all = document.querySelectorAll('button.emoji:not(.hide)')
  var focusedElement = document.querySelector('.emoji:focus')
  var nodeIndex = Array.prototype.indexOf.call(all, focusedElement)
  var resultPerRow = Math.floor(containerElement.clientWidth / all[0].clientWidth)
  var resultPerCol = Math.floor(containerElement.clientHeight / all[0].clientHeight)
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
