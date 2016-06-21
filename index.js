var menubar = require('menubar')
var ipc = require('electron').ipcMain
var globalShortcut = require('global-shortcut')
var mb = menubar({ dir: __dirname + '/app', width: 440, height: 230, icon: __dirname + '/app/Icon-Template.png', preloadWindow: true, 'window-position': 'topRight' })
var Menu = require('menu')

mb.on('show', function () {
  mb.window.webContents.send('show')
})

mb.app.on('will-quit', function () {
  globalShortcut.unregisterAll()
})

mb.app.on('activate', function () {
  mb.showWindow()
})

// when receive the abort message, close the app
ipc.on('abort', function () {
  mb.hideWindow()
})

// when receive the abort message, close the app
ipc.on('update-preference', function (evt, pref, initialization) {
  registerShortcut(pref['open-window-shortcut'], initialization)
})
// Consider checking for every accelerator string and replacing them with CmdOrCtrl. This was chosen as it's less obfuscated imo.
var KEYS ={
  PREFERENCE: process.platform==='darwin'? 'Command+,': 'CmdOrCtrl+,',
  QUIT: process.platform==='darwin'? 'Command+Q': 'CmdOrCtrl+Q',
  DEVTOOLS: process.platform==='darwin'? 'Alt+Command+I': 'Alt+CmdOrCtrl+I'
}

var template = [
  {
    label: 'Mojibar',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'Command+Z',
        selector: 'undo:'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        selector: 'redo:'
      },
      {
        label: 'Cut',
        accelerator: 'Command+X',
        selector: 'cut:'
      },
      {
        label: 'Copy',
        accelerator: 'Command+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: 'Command+V',
        selector: 'paste:'
      },
      {
        label: 'Select All',
        accelerator: 'Command+A',
        selector: 'selectAll:'
      },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function (item, focusedWindow) { if (focusedWindow) focusedWindow.reload() }
      },
      {
        label: 'Preference',
        accelerator: KEYS.PREFERENCE,
        click: function () { mb.window.webContents.send('open-preference') }
      },
      {
        label: 'Quit App',
        accelerator: KEYS.QUIT,
        selector: 'terminate:',
        click: function() { mb.window.close() }
      },
      {
        label: 'Toggle DevTools',
        accelerator: KEYS.DEVTOOLS,
        click: function () { mb.window.toggleDevTools() }
      }
    ]
  }
]

mb.on('ready', function ready () {
  // Build default menu for text editing and devtools. (gone since electron 0.25.2)
  var menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})

// Register a shortcut listener.
var registerShortcut = function (keybinding, initialization) {
  globalShortcut.unregisterAll()

  try {
    var ret = globalShortcut.register(keybinding, function () {
      mb.window.isVisible() ? mb.hideWindow() : mb.showWindow()
    })
  } catch (err) {
    mb.window.webContents.send('preference-updated', false, initialization)
  }

  if (ret) {
    mb.window.webContents.send('preference-updated', true, initialization)
  }
}
