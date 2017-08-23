/* global localStorage, alert */
var preference
var ipc = require('electron').ipcRenderer
var modifiers = require('emojilib').fitzpatrick_scale_modifiers

var defaultPreference = {
  'open-window-shortcut': 'ctrl+shift+space',
  'emoji-size': '20',
  'open-at-login': false,
  'skin-tone-modifier': ''
}

var preferenceNames = {
  'open-window-shortcut': 'Mojibar shortcut',
  'emoji-size': 'Emoji font size',
  'open-at-login': 'Start Mojibar at login',
  'skin-tone-modifier': 'Skin tone modifier'
}

var applyPreferences = function (preference, initialization) {
  localStorage.setItem('preference', JSON.stringify(preference))

  ipc.send('update-preference', preference, initialization)
  var style = document.createElement('style')
  style.innerText = '.emoji { font-size: ' + preference['emoji-size'] + 'px; width: ' + (Number(preference['emoji-size']) + 20) + 'px; height: ' + (Number(preference['emoji-size']) + 20) + 'px; }'
  document.body.appendChild(style)
  // Update skin tone setting
  window.search(window.searchInput.value)
  window.searchInput.focus()
}

var savePreference = function (event) {
  event.preventDefault()

  Object.keys(preference).forEach(function (key) {
    var el = document.getElementById(key)
    preference[key] = el.nodeName === 'INPUT' && el.type === 'checkbox' ? el.checked : el.value
  })

  applyPreferences(preference)
}

if (localStorage.getItem('preference')) {
  preference = JSON.parse(localStorage.getItem('preference'))
  Object.keys(defaultPreference).forEach(function (key) {
    if (!preference[key]) preference[key] = defaultPreference[key]
  })
} else {
  preference = defaultPreference
}

applyPreferences(preference, true)

ipc.on('open-preference', function (event, message) {
  togglePreferencePanel()
})

ipc.on('preference-updated', function (event, result, initialization) {
  if (result) {
    if (!initialization) {
      alert('Saved!')
      togglePreferencePanel()
    }
  } else {
    alert('Something went wrong, likely related to keybindings. See http://electron.atom.io/docs/v0.36.5/api/accelerator/ for more.')
  }
})

var togglePreferencePanel = function () {
  if (document.body.classList.contains('on-preference')) {
    document.body.classList.remove('on-preference')
    document.getElementById('js-preference-panel').remove()
  } else {
    var preference = JSON.parse(localStorage.getItem('preference'))
    var panel = document.createElement('div')

    panel.classList.add('preference-panel')
    panel.id = 'js-preference-panel'
    var html = '<form>'
    Object.keys(preferenceNames).forEach(function (key) {
      html += '<div class="pref-item">'
      if (typeof preference[key] === 'boolean') {
        html += '<label>'
        html += '<input type="checkbox" id="' + key + '"' + (preference[key] ? 'checked' : '') + '>'
        html += preferenceNames[key]
        html += '</label>'
      } else if (key === 'skin-tone-modifier') {
        html += '<label for="' + key + '">'
        html += preferenceNames[key]
        html += '</label>'
        html += '<select id="' + key + '">>'
        html += `<option value="">None</option>`
        modifiers.forEach(function (modifier) {
          html += `<option value="${modifier}" ${preference[key] === modifier ? 'selected' : ''}>${modifier}</option>`
        })
        html += '</select>'
        html += '</label>'
      } else {
        html += '<label for="' + key + '">'
        html += preferenceNames[key]
        html += '</label>'
        html += '<input type="text" id="' + key + '" value="' + preference[key] + '" placeholder="' + defaultPreference[key] + '">'
      }
      html += '</div>'
    })
    html += '<label></label><button type="submit">Save</button>'
    html += `<code class="version">mojibar@${require('../package.json').version}</code>`
    if (localStorage.getItem('emojilibVersion')) html += `<code class="version">emojilib@${localStorage.getItem('emojilibVersion')}</code>`
    html += '</form>'
    panel.innerHTML += html

    panel.getElementsByTagName('form')[0].onsubmit = savePreference

    document.body.classList.add('on-preference')
    document.body.appendChild(panel)
    panel.getElementsByTagName('input')[0].focus()
  }
}
