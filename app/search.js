var emojis = require('emojilib')
var clipboard = require('clipboard')
var ipc = require('electron').ipcRenderer
var index = buildIndex(emojis)
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
searchInput.addEventListener('input', function (evt) {
  search(this.value)
})

document.addEventListener('mousewheel', function (e) {
  if (e.deltaY % 1 !== 0) {
    e.preventDefault()
  }
})

document.addEventListener('keydown', function (evt) {
  if (evt.target.className.match('js-search') && evt.keyCode === 40) {
    // on down: focus on the first thing!
    jumpto('up')
    evt.preventDefault()
  } else if (evt.target.classList.contains('emoji')) {
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
        data = ':' + evt.target.getAttribute('aria-label') + ':'
      } else {
        data = evt.target.innerText
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
    evt.preventDefault()
  } else if (evt.keyCode === 27) {
    // on escape: exit
    ipc.send('abort')
  }
})

document.addEventListener('keypress', function (evt) {
  // if typing while navigatin, just type into the search box!
  var word = isWord(evt.charCode)
  if (word && evt.target.classList.contains('emoji')) {
    searchInput.focus()
    searchInput.value = word
  }
})

function search (query) {
  if (searching) {
    clearTimeout(searching)
  }
  searching = setTimeout(function () {
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
      var result = '<button type="button" class="emoji" aria-label="' + name + '">' + unicode + '</button>'
      return result
    }).join('')

    document.querySelector('.js-results').innerHTML = results
    if (document.querySelector('.emoji')) document.querySelector('.emoji').scrollIntoViewIfNeeded()
  }, 100)
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
    console.log(resultPerCol)
    newTarget = nodeIndex + resultPerRow * (resultPerCol - 1)
  } else if (destination === 'prev') {
    newTarget = nodeIndex - resultPerRow * (resultPerCol - 1)
  }

  if (newTarget < 0) newTarget = 0
  if (newTarget >= all.length - 1) newTarget = all.length - 1
  if (all[newTarget]) {
    all[newTarget].focus()
    all[newTarget].scrollIntoViewIfNeeded()
  }
}
