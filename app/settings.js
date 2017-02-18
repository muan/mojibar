var preference
var ipc = require('electron').ipcRenderer

var defaultPreference = {
  'open-window-shortcut': 'ctrl+shift+space',
  'emoji-size': '40',
  'window-position': 'topRight',
  'open-at-login': false,
}

var preferenceNames = {
  'open-window-shortcut': 'Mojibar shortcut',
  'emoji-size': 'Emoji size',
  'window-position': 'Window Position',
  'open-at-login': 'Start Mojibar at login',
}

var applyPreferences = function (preference, initialization) {
  window.localStorage.setItem('preference', JSON.stringify(preference))

  ipc.send('update-preference', preference, initialization)
  var style = document.createElement('style')
  style.innerText = '.emoji { width: ' + preference['emoji-size'] + 'px; height: ' + preference['emoji-size'] + 'px; }'
  document.body.appendChild(style)
}

var savePreference = function (event) {
  event.preventDefault()

  Object.keys(preference).forEach(function (key) {
    var el = document.getElementById(key)
    preference[key] = el.type === 'checkbox' ? el.checked : el.value
  })

  applyPreferences(preference)
}

if (window.localStorage.getItem('preference')) {
  preference = JSON.parse(window.localStorage.getItem('preference'))
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
      var prefTitle = preferenceNames[key]
      var prefVal = preference[key]
      html += '<div class="pref-item"><label for="' + key + '">'
      if (typeof defaultPreference[key] === 'boolean') {
        html += '<label>'
        html += '<input type="checkbox" id="' + key + '"' + (prefVal ? 'checked' : '') + '>'
        html += prefTitle
        html += '</label>'
	  } else if (key == 'window-position') {
	    let positionOptions = {
          'topLeft': 'Top Left',
          'topRight': 'Top Right',
          'bottomLeft': 'Bottom Left',
          'bottomRight': 'Bottom Right',
          'topCenter': 'Top Center',
          'bottomCenter': 'Bottom Center',
          'center': 'Center'
	    };
        html += '<label for="' + key + '">'
        html += prefTitle
        html += '</label>'
        html += '<select id="' + key + '">'
        for(let opt in positionOptions) {
          let title = positionOptions[opt];
          html += '<option value="' + opt + '"' + (prefVal == opt ? ' selected' : '') + '>' + title + '</option>'
        }
        html += '</select>'
      } else {
        html += prefTitle
        html += '</label>'
        html += '<input type="text" id="' + key + '" value="' + prefVal + '" placeholder="' + defaultPreference[key] + '">'
      }
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
