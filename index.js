var { app, ipcMain, globalShortcut, Menu } = require('electron')
var menubar = require('menubar')
var mb = menubar({ dir: __dirname + '/app', width: 440, height: 270, icon: __dirname + '/app/Icon-Template.png', preloadWindow: true, windowPosition: 'topRight' })
var isDev = require('electron-is-dev')

mb.on('show', function () {
  mb.window.webContents.send('show')
})

mb.on('after-hide', function() {
  mb.app.hide()
})

mb.app.on('will-quit', function () {
  globalShortcut.unregisterAll()
})

mb.app.on('activate', function () {
  mb.showWindow()
})

// when receive the abort message, close the app
ipcMain.on('abort', function () {
  mb.hideWindow()
})

// update shortcuts when preferences change
ipcMain.on('update-preference', function (evt, pref, initialization) {
  registerShortcut(pref['open-window-shortcut'], initialization)

  // Make packaged app (not dev app) start at login
  if (!isDev) {
    app.setLoginItemSettings({
      openAtLogin: pref['open-at-login'],
      openAsHidden: true
    })
  }
})

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
        accelerator: 'Command+,',
        click: function () { mb.window.webContents.send('open-preference') }
      },
      {
        label: 'Quit App',
        accelerator: 'Command+Q',
        selector: 'terminate:'
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Alt+Command+I',
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
