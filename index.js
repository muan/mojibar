var menubar = require('menubar')
var globalShortcut = require('global-shortcut')

var mb = menubar({ dir: __dirname, height: 100 })

mb.app.on('ready', function() {
  console.log('wowo')
  // Register a 'ctrl+shift+space' shortcut listener.
  var ret = globalShortcut.register('ctrl+shift+space', function() {
    mb.emit('ready')
    mb.tray.emit('clicked')
    console.log('ctrl+shift+space is pressed')
  })

  if (!ret) {
    console.log('registration failed')
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered('ctrl+shift+space'))
})

mb.app.on('will-quit', function() {
  // Unregister a shortcut.
  globalShortcut.unregister('ctrl+shift+space')

  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})

mb.on('ready', function ready () {
  console.log('yayapp')
})
