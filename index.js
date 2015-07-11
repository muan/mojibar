var menubar = require('menubar')
var ipc = require('ipc')
var globalShortcut = require('global-shortcut')

var mb = menubar({ dir: __dirname + '/app', height: 140, x: 0, y: 0 })

mb.app.on('ready', function () {
  // Register a 'ctrl+shift+space' shortcut listener.
  var ret = globalShortcut.register('ctrl+shift+space', function() {
    // It gets angry not knowing where to put the window if bounds not passed
    mb.tray.emit('clicked', null, {x: 0, y:0, width: 0, height: 0})
  })

  if (!ret) {
    console.log('registration failed')
  }
})

mb.app.on('will-quit', function () {
  globalShortcut.unregisterAll()
})

mb.on('ready', function ready () {
  console.log('READY')
})

ipc.on('abort', function () {
  mb.emit('hide')
  mb.window.hide()
  mb.emit('after-hide')
})
