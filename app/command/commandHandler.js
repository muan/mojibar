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

module.exports = CommandHandler;
