function CommandHandler(command, worksWithoutParam) {
  this.command = command;
  this.worksWithoutParam = worksWithoutParam;
}

CommandHandler.prototype.getCommand = function() {
  return this.command;
}

CommandHandler.prototype.registerProcessor = function(processor) {
  this.processor = processor;
}

CommandHandler.prototype.requireParam = function () {
  return !this.worksWithoutParam;
};

CommandHandler.prototype.initHandler = function () {
  return;
};

CommandHandler.prototype.cleanUpHandler = function () {
  return;
};

module.exports = CommandHandler;
