/* global localStorage, fetch */
const unicodeEmojiJsonData = require('unicode-emoji-json')
const emojilibkeywordSet = JSON.parse(localStorage.getItem('emojilib')) || require('emojilib')
const emojilib = fetchEmojilibData(unicodeEmojiJsonData, emojilibkeywordSet)
const emojikeys = JSON.parse(localStorage.getItem('emojikeys')) || require('unicode-emoji-json/data-ordered-emoji')
const { Debugger } = require('electron')
const modifiers = require('unicode-emoji-json/data-emoji-components')
const clipboard = require('electron').clipboard
const ipc = require('electron').ipcRenderer
const index = buildIndex()
const indexKeys = Object.keys(index)
const emojikeyIndexTable = buildEmojikeyIndexTable()
let searching = false
const searchInput = document.querySelector('.js-search')
const preference = JSON.parse(localStorage.getItem('preference'))
const directions = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down'
}

function fetchEmojilibData (data, keywordSet) {
  for (const emoji in data) {
    data[emoji].keywords = keywordSet[emoji]
  }
  return data
}

function fetchAndUpdateLocalCache () {
  if (!navigator.onLine) return
  const expireTime = localStorage.getItem('emojilibExpireTime')
  if (expireTime && Number(expireTime) > new Date().getTime()) return
  const version = '^3.0.0'
  const emojilibLib = `https://unpkg.com/emojilib@${version}/dist/emoji-en-US.json`
  const emojilibOrdered = `https://unpkg.com/unicode-emoji-json@${version}/data-ordered-emoji.json`

  fetch(emojilibLib)
  .then(function (res) { return checkIfNewVersion(res) })
  .then(function (newData) {
    // Fetch only once per day
    localStorage.setItem('emojilibExpireTime', new Date().getTime() + 1000 * 60 * 60 * 24)
    if (!newData) return
    localStorage.setItem('emojilib', JSON.stringify(newData))

    fetch(emojilibOrdered).then(function (res) { return res.json() }).then(function (newData) {
      localStorage.setItem('emojikeys', JSON.stringify(newData))
      window.location.reload()
    })
  })

  function checkIfNewVersion (res) {
    const fetchedVersion = res.url.match(/@([\d.]+)/)[1]
    if (fetchedVersion !== localStorage.getItem('emojilibVersion')) {
      localStorage.setItem('emojilibVersion', fetchedVersion)
      return res.json()
    }
  }
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

ipc.on('fetch', function (event, message) {
  fetchAndUpdateLocalCache()
})

document.addEventListener('mousewheel', function (e) {
  if (e.deltaY % 1 !== 0) {
    e.preventDefault()
  }
})
document.addEventListener('keydown', function (evt) {
  const onSearchField = !!evt.target.dataset.isSearchInput
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
  let data
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
  const word = isWord(evt.charCode)
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
    let results
    if (query.length === 0 || (query.length === 1 && query.charCodeAt() <= 255)) {
      results = emojikeys.slice(0)
    } else {
      let resultsDict = null
      const words = query.split(/\s+/)
      for (const i in words) {
        const word = words[i]
        if (word === '') continue

        let wordResultsDict = {}
        indexKeys.forEach(function matchQuery (keyword) {
          if (stringIncludes(keyword, word)) {
            index[keyword].forEach(function addMatchingEmoji (emoji) {
              wordResultsDict[emoji] = true
            })
          }
        })

        if (resultsDict === null) {
          // Just initialize it.
          resultsDict = wordResultsDict
        } else {
          // Intersect with existing results.
          for (const emoji in resultsDict) {
            if (!wordResultsDict.hasOwnProperty(emoji)) {
              delete resultsDict[emoji]
            }
          }
        }
      }
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
  const fragment = document.createDocumentFragment()
  const modifierValue = preference ? preference['skin-tone-modifier'] : 'none'
  const modifier = modifiers[modifierValue] ? modifierValue : null
  emojiNameArray.forEach(function (name) {
    const unicode = addModifier(emojilib[name], modifier) || '--'
    const resultElement = document.createElement('button')
    resultElement.type = 'button'
    resultElement.className = 'emoji'
    resultElement.setAttribute('aria-label', name)
    resultElement.textContent = unicode
    fragment.appendChild(resultElement)
  })
  containerElement.appendChild(fragment)
}

function buildEmojikeyIndexTable () {
  const indexTable = {}
  emojikeys.forEach(function (name, index) {
    indexTable[name] = index
  })
  return indexTable
}

function buildIndex () {
  const keywords = {}
  emojikeys.forEach(function (name) {
    const words = emojilib[name].keywords
    if (words) {
      words.push(name)
      // words.push(emojilib[name].char)
      // words.push(emojilib[name].category)

      words.forEach(function (word) {
        if (keywords[word] && keywords[word].indexOf(name) < 0) {
          keywords[word].push(name)
        } else if (!keywords[word]) {
          keywords[word] = [name]
        }
      })
    }
  })

  return keywords
}

function isWord (charCode) {
  return String.fromCharCode(charCode).match(/\w/)
}

// Insert modifier in front of zwj
function addModifier (emoji, modifier) {
  if (emoji.skin_tone_support || !modifier || !emoji.fitzpatrick_scale) {
    if (emoji.keywords) {
      return emoji.keywords[emoji.keywords.length - 1]
    } else {
      return false
    }
  }
  const zwj = new RegExp('‍', 'g')
  return emoji.char.match(zwj) ? emoji.char.replace(zwj, modifier + '‍') : emoji.char + modifier
}

function jumpto (destination) {
  const container = document.getElementsByClassName('js-results')[0]
  const all = document.getElementsByClassName('emoji')
  const focusedElement = document.querySelector('.emoji:focus')
  const nodeIndex = Array.prototype.indexOf.call(all, focusedElement)
  const resultPerRow = Math.floor(container.clientWidth / all[0].clientWidth)
  const resultPerCol = Math.floor(container.clientHeight / all[0].clientHeight)
  let newTarget

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
