import EventEmitter from 'events';

class Microphone extends EventEmitter {
	constructor(options) {
		super();

		this.options = options? options : {};

		if ('chunkSize' in options) this.chunkSize = options.chunkSize;
		else this.chunkSize = 8192;

		if ('volume' in options) this.volume = options.volume;
		else this.volume = 1;
	}

	createAudioProcessor(audioContext, audioSource) {
		let processor = audioContext.createScriptProcessor(this.chunkSize, 1, 1);
		const sampleRate = audioSource.context.sampleRate;
		processor.onaudioprocess = (event) => {
			var data = event.inputBuffer.getChannelData(0);

			if (this.muted) {
				for (let i=0;i<data.length;i++) {
					data[i] = 0;
				}
				console.log('muted');
			}
			this.emit('data', data, sampleRate);
		};
		processor.shutdown = () => {
			processor.disconnect();
			this.onaudioprocess = null;
		};
		return processor;
	}

	start() {
		this.audioContext = new AudioContext();

		const success = (stream) => {
			console.log('started recording');
			this.mediaStream = stream;
			this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
			this.processor = this.createAudioProcessor(this.audioContext, this.mediaStreamSource);
			this.mediaStreamSource.connect(this.processor);
			this.gainNode = this.audioContext.createGain();
			this.mediaStreamSource.connect(this.gainNode);
			this.gainNode.gain.value = this.volume;
			if (this.muted) {
				this._gain = this.gainNode.gain.value;
				this.gainNode.gain.value = 0;
			}

			this.gainNode.connect(this.processor);
			this.processor.connect(this.audioContext.destination);
			
			if (this.options.analyzer) {
				this.audioAnalyser = this.audioContext.createAnalyser();
				this.gainNode.connect(this.audioAnalyser);
				this.emit('analyser', this.audioAnalyser);
			}
		};

		const fail = (e) => {
			console.error('recording failure', e);
			debugger;
		};

		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			const microphone = this.options.microphone;
			const constraints = {
				audio: {
					deviceId: microphone ? {exact: microphone} : undefined
				}
			};
			navigator.mediaDevices.getUserMedia(constraints)
			.then(success)
			.catch(fail);
		}
		else {
			navigator.getUserMedia({
				video: false,
				audio: true
			}, success, fail);
		}
	}

	stop() {
		
		if (this.mediaStream) {
			this.mediaStream.getTracks()[0].stop();
		}
		if (this.mediaStreamSource) {
			this.mediaStreamSource.disconnect();
		}
		if (this.processor) {
			this.processor.shutdown();
		}
		if (this.audioContext) {
			this.audioContext.close();
		}
	}

	setVolume(volume) {
		this.volume = volume;

		this._gain = volume;
		this.gainNode.gain.value = volume;
	}

	setMuted(muted) {
		this.muted = muted;

		if (this.gainNode) {
			if (muted) {
				this._gain = this.gainNode.gain.value;
				this.gainNode.gain.value = 0;
			}
			else {
				this.gainNode.gain.value = this._gain || 1;
			}
		}
	}
}

export default Microphone;
