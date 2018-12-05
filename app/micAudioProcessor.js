let micProc;

function MicAudioProcessor() {
  micProc = this;

  this.audioContext = new AudioContext();
  this.browserSampleRate = this.audioContext.sampleRate;// 44100
  this.srcBufferSize = 1024;
  // with buffer size of 1024, we can capture 44032 features for original sample rate of 44100
  // once audio of 44100 features is down sampled to 16000 features,
  // resulting number of features is 15953

  this.data = [];

  // enable mic
  var successCallback = function (micStream) {
    console.log('User allowed microphone access.');
    micProc.initDownSampleNode();
    micProc.micSource = micProc.audioContext.createMediaStreamSource(micStream);
    micProc.micSource.connect(micProc.downSampleNode);
    micProc.downSampleNode.connect(micProc.audioContext.destination);
  };

  var errorCallback = function (err) {
    console.log('Initializing microphone has failed. Falling back to default audio file', err);
  };

  try {
    navigator.getUserMedia = navigator.webkitGetUserMedia ||
    navigator.getUserMedia || navigator.mediaDevices.getUserMedia;
    var constraints = { video: false, audio: true };

    console.log('Asking for permission...');

    navigator.mediaDevices.getUserMedia(constraints)
    .then(successCallback)
    .catch(errorCallback);
  } catch (err) {
    errorCallback(err);
  }
}

MicAudioProcessor.prototype.initDownSampleNode = function() {
  // down sampling input mic
  this.offlineSampleRate = 16000;
  this.downSampleNode = this.audioContext.createScriptProcessor(this.srcBufferSize, 1, 1);
  this.downSampledBufferSize = (this.offlineSampleRate / this.browserSampleRate) * this.srcBufferSize;

  function interpolateArray(data, fitCount) {
    var linearInterpolate = function (before, after, atPoint) {
      return before + (after - before) * atPoint;
    };

    var newData = new Array();
    var springFactor = new Number((data.length - 1) / (fitCount - 1));
    newData[0] = data[0]; // for new allocation
    for ( var i = 1; i < fitCount - 1; i++) {
      var tmp = i * springFactor;
      var before = new Number(Math.floor(tmp)).toFixed();
      var after = new Number(Math.ceil(tmp)).toFixed();
      var atPoint = tmp - before;
      newData[i] = linearInterpolate(data[before], data[after], atPoint);
    }
    newData[fitCount - 1] = data[data.length - 1]; // for new allocation
    return newData;
  }

  this.downSampleNode.onaudioprocess = function(audioProcessingEvent) {
    var inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
    var downSampledData = interpolateArray(inputData, micProc.downSampledBufferSize);
    if (micProc.data.length > micProc.offlineSampleRate) {
      micProc.data.splice(0, micProc.downSampledBufferSize);
    }
    micProc.data = micProc.data.concat(downSampledData);
  }
}

MicAudioProcessor.prototype.getData = function() {
  return this.data;
}

module.exports = MicAudioProcessor;
