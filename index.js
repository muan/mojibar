var { app, ipcMain, globalShortcut, Menu } = require('electron')
var isWin = /^win/.test(process.platform)
var isMac = /darwin/.test(process.platform)
var iconType = (isWin ? 'color' : 'monotone'); // Will vary depending on OS.
var menubar = require('menubar')
var mb = menubar({ dir: __dirname + '/app', width: 440, height: 270, icon: __dirname + '/app/icons/' + iconType + '.png', preloadWindow: true, windowPosition: 'topRight', alwaysOnTop: true })
var isDev = require('electron-is-dev')

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

  mb.setOption('windowPosition', pref['window-position'])
})

// Since Windows/Linux use 'control' key and only Mac uses 'command'.
var superHotKey = isMac ? 'CommandOrControl' : 'Control+Shift'

var template = [
  {
    label: 'Mojibar',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CommandOrControl+Z',
        selector: 'undo:'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CommandOrControl+Z',
        selector: 'redo:'
      },
      {
        label: 'Cut',
        accelerator: 'CommandOrControl+X',
        selector: 'cut:'
      },
      {
        label: 'Copy',
        accelerator: 'CommandOrControl+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: 'CommandOrControl+V',
        selector: 'paste:'
      },
      {
        label: 'Select All',
        accelerator: 'CommandOrControl+A',
        selector: 'selectAll:'
      },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function (item, focusedWindow) { if (focusedWindow) focusedWindow.reload() }
      },
      {
        label: 'Preference',
        accelerator: superHotKey + '+,',
        click: function () { mb.window.webContents.send('open-preference') }
      },
      {
        label: 'Quit App',
        accelerator: superHotKey + '+Q',
        click: function () { app.quit() }
	  },
      {
        label: 'Toggle DevTools',
        accelerator: (isMac ? 'Alt+CommandOrControl' : 'Control+Shift') + '+I',
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
      if (mb.window.isVisible()) {
        return mb.hideWindow()
      }

      mb.showWindow()
      mb.window.focus()
    })
  } catch (err) {
    mb.window.webContents.send('preference-updated', false, initialization)
  }

  if (ret) {
    mb.window.webContents.send('preference-updated', true, initialization)
  }
}
