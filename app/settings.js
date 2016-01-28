var preference
var ipc = require('electron').ipcRenderer

var defaultPreference = {
  'open-window-shortcut': 'ctrl+shift+space',
  'emoji-size': '20'
}

var preferenceNames = {
  'open-window-shortcut': 'Mojibar shortcut',
  'emoji-size': 'Emoji font size'
}

var applyPreferences = function (preference, initialization) {
  ipc.send('update-preference', preference, initialization)
  var style = document.createElement('style')
  style.innerText = '.emoji { font-size: ' + preference['emoji-size'] + 'px; width: ' + (Number(preference['emoji-size']) + 20) + 'px; height: ' + (Number(preference['emoji-size']) + 20) + 'px; }'
  document.body.appendChild(style)
}

var savePreference = function () {
  Object.keys(preference).forEach(function (key) {
    preference[key] = document.getElementById(key).value
  })

  window.localStorage.setItem('preference', JSON.stringify(preference))
  applyPreferences(preference)
  return false
}

if (window.localStorage.getItem('preference')) {
  preference = JSON.parse(window.localStorage.getItem('preference'))
  Object.keys(defaultPreference).forEach(function (key) {
    if (!preference[key]) preference[key] = defaultPreference[key]
  })
} else {
  preference = defaultPreference
}
window.localStorage.setItem('preference', JSON.stringify(preference))
applyPreferences(preference, true)

ipc.on('open-preference', function (event, message) {
  togglePreferencePanel()
})

ipc.on('preference-updated', function (event, result, initialization) {
  if (result) {
    if (!initialization) {
      window.alert('Saved!')
      togglePreferencePanel()
    }
  } else {
    window.alert('Something went wrong, likely related to keybindings. See http://electron.atom.io/docs/v0.36.5/api/accelerator/ for more.')
  }
})

var togglePreferencePanel = function () {
  if (document.body.classList.contains('on-preference')) {
    document.body.classList.remove('on-preference')
    document.getElementById('js-preference-panel').remove()
  } else {
    var preference = JSON.parse(window.localStorage.getItem('preference'))
    var panel = document.createElement('div')

    panel.classList.add('preference-panel')
    panel.id = 'js-preference-panel'
    var html = '<form>'
    Object.keys(preferenceNames).forEach(function (key) {
      html += '<div class="pref-item"><label for="' + key + '">'
      html += preferenceNames[key]
      html += '</label>'
      html += '<input type=" text" id="' + key + '" value="' + preference[key] + '" placeholder="' + defaultPreference[key] + '">'
      html += '</div>'
    })
    html += '<label></label><button type="submit">Save</button>'
    html += '</form>'
    panel.innerHTML += html

    panel.getElementsByTagName('form')[0].onsubmit = savePreference

    document.body.classList.add('on-preference')
    document.body.appendChild(panel)
    panel.getElementsByTagName('input')[0].focus()
  }
}
