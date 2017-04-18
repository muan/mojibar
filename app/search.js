var emojilib = require('emojilib').lib
var emojikeys = require('emojilib').ordered
var emojiSearch = require('emoji-search')
var clipboard = require('electron').clipboard
var ipc = require('electron').ipcRenderer

var searching = false
var searchInput = document.querySelector('.js-search')
var directions = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down'
}

var orderedEmojiChars = emojikeys.map(function (name) { return emojilib[name]['char'] })

var charToName = {}
emojikeys.forEach(function (name) {
  var char = emojilib[name]['char']
  charToName[char] = name
})

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

// if click on and emoji item, copy emoji unicode char to clipboard on click or
// copy emoji code if `shiftKey` is pressed
document.addEventListener('click', function (evt) {
  if (evt.target.classList.contains('emoji')) {
    copyFocusedEmoji(evt.target, evt.shiftKey)
  }
})

function search (query) {
  if (searching) {
    clearTimeout(searching)
  }
  searching = setTimeout(function () {
    var results
    if (query.length === 0 || (query.length === 1 && query.charCodeAt() <= 255)) {
      results = orderedEmojiChars
    } else {
      results = emojiSearch(query)
    }

    renderResults(results, document.querySelector('.js-results'))
    if (document.querySelector('.emoji')) document.querySelector('.emoji').scrollIntoViewIfNeeded()
  }, 80)
}

function renderResults (emojiCharArray, containerElement) {
  containerElement.innerHTML = ''
  var fragment = document.createDocumentFragment()
  emojiCharArray.forEach(function (emojiChar) {
    var unicode = (emojiChar || '--')
    var resultElement = document.createElement('button')
    resultElement.type = 'button'
    resultElement.className = 'emoji'
    resultElement.setAttribute('aria-label', charToName[emojiChar] || '')
    resultElement.textContent = unicode
    fragment.appendChild(resultElement)
  })
  containerElement.appendChild(fragment)
}

function isWord (charCode) {
  var word = String.fromCharCode(charCode).match(/\w/)
  return word || false
}

function jumpto (destination) {
  var container = document.getElementsByClassName('js-results')[0]
  var all = document.getElementsByClassName('emoji')
  var focusedElement = document.querySelector('.emoji:focus')
  var nodeIndex = Array.prototype.indexOf.call(all, focusedElement)
  var resultPerRow = Math.floor(container.clientWidth / all[0].clientWidth)
  var resultPerCol = Math.floor(container.clientHeight / all[0].clientHeight)
  var newTarget

  if (destination === 'up') {
    newTarget = nodeIndex - resultPerRow
  } else if (destination === 'down') {
    newTarget = nodeIndex + resultPerRow
  } else if (destination === 'left') {
    if ((nodeIndex + 1) % resultPerRow === 1) {
      // Wrap to previous row.
      newTarget = nodeIndex + (resultPerRow - 1) // Adjust to last column.
      newTarget -= resultPerRow // Up one row.
    } else {
      newTarget = nodeIndex - 1
    }
  } else if (destination === 'right') {
    if ((nodeIndex + 1) % resultPerRow === 0) {
      // Wrap to next row.
      newTarget = nodeIndex - (resultPerRow - 1) // Adjust to first column.
      newTarget += resultPerRow // Down one row.
    } else {
      newTarget = nodeIndex + 1
    }
  } else if (destination === 'next') {
    newTarget = nodeIndex + resultPerRow * (resultPerCol - 1 || 1)
  } else if (destination === 'prev') {
    newTarget = nodeIndex - resultPerRow * (resultPerCol - 1 || 1)
  }

  if (newTarget < 0) {
    // Allow jump back up to search field IF already at first item.
    if (nodeIndex === 0) {
    // Purposefully mismatch so we focus on input instead.
      newTarget = -1
    } else {
      newTarget = 0
    }
  }
  if (newTarget >= all.length - 1) newTarget = all.length - 1
  if (all[newTarget]) {
    all[newTarget].focus()
    all[newTarget].scrollIntoViewIfNeeded()
  } else {
    searchInput.focus()
  }
}
