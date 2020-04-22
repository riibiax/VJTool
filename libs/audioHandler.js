var AudioHandler = function() {

	var source;
	var buffer;
	var audioBuffer;
	var audioContext = new AudioContext();

	var analyser;
	var freqByteData;
	var timeByteData;
	var waveData = []; //waveform - from 0 - 1 . no sound is 0.5. Array [binCount]
	var levelsData = []; //levels of each frequecy - from 0 - 1 . no sound is 0. Array [levelsCount]
	var waveTexture;
	var levelTexture;
	var binCount;
	var levelBins;
	var levelsCount = 16; //should be factor of 512

	var isPlayingAudio = false;
	var volume =0;
	var beatCutOff = 0;
	var beatTime = 0; //avoid auto beat at start

	function getMicInput() {
		var p = navigator.mediaDevices.getUserMedia({ audio: true, video: false });
		p.then(function(stream) {

			//called after user has enabled mic access
			source = audioContext.createBufferSource();
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 1024;
			analyser.smoothingTimeConstant = 0.3;

			microphone = audioContext.createMediaStreamSource(stream);
			microphone.connect(analyser);
			startViz();
		})
		.catch(function(err) {
		  console.log(err.name + ": " + err.message);
		});
	}

	//load sample MP3
	function loadSampleAudio() {

		source = audioContext.createBufferSource();
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 1024;

		// Connect audio processing graph
		source.connect(analyser);
		analyser.connect(audioContext.destination);
		loadAudioBuffer("mp3/computer_jazz.mp3");
	}

	function loadAudioBuffer(url) {
		// Load asynchronously
		var request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.responseType = "arraybuffer";

		request.onload = function() {
			

			audioContext.decodeAudioData(request.response, function(buffer) {
					audioBuffer = buffer;
					finishLoad();
			 }, function(e) {
				console.log(e);
			});

		};

		request.send();
	}

	function finishLoad() {
		source.buffer = audioBuffer;
		source.loop = true;
		source.start(0.0);
		startViz();
	}

	function onDocumentDragOver(evt) {
		introPanel.style.display = 'none';
		promptPanel.style.display = 'inline';
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	}

	//load dropped MP3
	function onDocumentDrop(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		if (source) source.disconnect();

		var droppedFiles = evt.dataTransfer.files;

		var reader = new FileReader();

		reader.onload = function(fileEvent) {
			var data = fileEvent.target.result;
			initAudio(data);
		};

		reader.readAsArrayBuffer(droppedFiles[0]);
		promptPanel.innerHTML = '<h1>loading...</h1>';

	}

	function initAudio(data) {
		source = audioContext.createBufferSource();

		if(audioContext.decodeAudioData) {
			audioContext.decodeAudioData(data, function(buffer) {
				source.buffer = buffer;
				createAudio();
			}, function(e) {
				console.log(e);
			});
		} else {
			source.buffer = audioContext.createBuffer(data, false );
			createAudio();
		}
	}


	function createAudio() {
		//processor = audioContext.createJavaScriptNode(2048 , 1 , 1 );

		analyser = audioContext.createAnalyser();
		analyser.smoothingTimeConstant = 0.1;

		source.connect(audioContext.destination);
		source.connect(analyser);

		//analyser.connect(processor);
		//processor.connect(audioContext.destination);

		source.start(0);

		source.loop = true;

		startViz();
	}

	function startViz(){
		binCount = analyser.frequencyBinCount;
		levelBins = Math.floor(binCount / levelsCount); //number of bins in each level
		freqByteData = new Uint8Array(binCount);
		timeByteData = new Uint8Array(binCount);
		waveTexture = new THREE.DataTexture( timeByteData, .5 * timeByteData.length, 1, THREE.LuminanceFormat );
		waveTexture.minFilter = THREE.NearestFilter;
		waveTexture.magFilter = THREE.NearestFilter;
		waveTexture.needsUpdate = true;
		levelTexture = new THREE.DataTexture( freqByteData, .5 * freqByteData.length, 1, THREE.LuminanceFormat );
		levelTexture.minFilter = THREE.NearestFilter;
		levelTexture.magFilter = THREE.NearestFilter;
		levelTexture.needsUpdate = true;
		isPlayingAudio = true;
	}

	function update(){

		if (!isPlayingAudio){
			return;
		}
		analyser.getByteFrequencyData(freqByteData);
		analyser.getByteTimeDomainData(timeByteData);
		waveTexture.needsUpdate = true;
		levelTexture.needsUpdate = true;

		//normalize waveform data
		for(var i = 0; i < binCount; i++) {
			waveData[i] = ((timeByteData[i] - 128) /128 )* ControlsHandler.audioParams.volSens;
		}

		//normalize levelsData from freqByteData
		for(var i = 0; i < levelsCount; i++) {
			var sum = 0;
			for(var j = 0; j < levelBins; j++) {
				sum += freqByteData[(i * levelBins) + j];
			}
			levelsData[i] = sum / levelBins/256 * ControlsHandler.audioParams.volSens; //freqData maxs at 256
		}
		//GET AVG LEVEL
		var sum = 0;
		for(var j = 0; j < levelsCount; j++) {
			sum += levelsData[j];
		}

		volume = sum / levelsCount;

		//BEAT DETECTION
		if (volume  > beatCutOff && volume > ControlsHandler.audioParams.beatMin){
			beatCutOff = volume *1.1;
			beatTime = 0;
		}else{
			if (beatTime < ControlsHandler.audioParams.beatHoldTime){
				beatTime ++;
			}else{
				beatCutOff *= ControlsHandler.audioParams.beatDecayRate;
				beatCutOff = Math.max(beatCutOff,ControlsHandler.audioParams.beatMin);
			}
		}
	}


	return {
		getMicInput: getMicInput,
		loadSampleAudio: loadSampleAudio,
		loadAudioBuffer: loadAudioBuffer,
		update: update,
		getVolume: function() { return volume; },
		getBeat: function() { if(beatTime < 6) return 1.0; return 0.0; },
		getWaveData: function() { return waveTexture; },
		getLevelData: function() { return levelTexture; }
	};

};