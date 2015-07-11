var menubar = require('menubar')
var globalShortcut = require('global-shortcut')

var mb = menubar({ dir: __dirname, height: 200, x: 0, y: 0 })

mb.app.on('ready', function() {
  // Register a 'ctrl+shift+space' shortcut listener.
  var ret = globalShortcut.register('ctrl+shift+space', function() {
    // It gets angry not knowing where to put the window if bounds not passed
    mb.tray.emit('clicked', null, {x: 0, y:0, width: 30, height: 30})
    console.log('ctrl+shift+space is pressed')
  })

  if (!ret) {
    console.log('registration failed')
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered('ctrl+shift+space'))
})

mb.app.on('will-quit', function() {
  globalShortcut.unregisterAll()
})

mb.on('ready', function ready () {
  console.log('READY')
})
