const { app, ipcMain, globalShortcut, Menu } = require('electron')
const isMac = /darwin/.test(process.platform)
const menubar = require('menubar')
const isDev = require('electron-is-dev')
const path = require('path')
const mb = menubar({
  dir: path.join(__dirname, '/app'),
  width: 440,
  height: 330,
  icon: path.join(__dirname, '/app/Icon-Template.png'),
  preloadWindow: true,
  windowPosition: 'trayLeft',
  alwaysOnTop: true,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
  }
})

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
  if (isMac) {
    mb.app.hide()
  } else {
    // Windows and Linux
    mb.window.blur()
    mb.hideWindow()
  }
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

const template = [
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
        accelerator: 'CommandOrControl+,',
        click: function () { mb.window.webContents.send('open-preference') }
      },
      {
        label: 'Quit App',
        accelerator: 'CommandOrControl+Q',
        selector: 'terminate:'
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Alt+CommandOrControl+I',
        click: function () { mb.window.toggleDevTools() }
      }
    ]
  }
]

mb.on('ready', function ready () {
  // Build default menu for text editing and devtools. (gone since electron 0.25.2)
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  mb.window.on('hide', function () {
    mb.window.webContents.send('fetch')
  })
})

// Close the window when losing focus
mb.on('focus-lost', function focusLost () {
  if (isMac) {
    mb.hideWindow()
  } else {
    // Windows and Linux
    mb.window.blur()
    mb.hideWindow()
  }
})

// Register a shortcut listener.
const registerShortcut = function (keybinding, initialization) {
  let ret = ''
  globalShortcut.unregisterAll()

  try {
    ret = globalShortcut.register(keybinding, function () {
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
