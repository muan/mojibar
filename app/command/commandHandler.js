function CommandHandler(command) {
  this.command = command;
}

CommandHandler.prototype.getCommand = function() {
  return this.command;
}

CommandHandler.prototype.registerProcessor = function(processor) {
  this.processor = processor;
}

module.exports = CommandHandler;
