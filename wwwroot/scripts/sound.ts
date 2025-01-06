
interface SoundDef {
    buffer: Promise<AudioBuffer>;
    gain: GainNode;
    panner: StereoPannerNode;
    source?: Promise<AudioBufferSourceNode>;
}

class Sound {
    private context: AudioContext;
    private sounds: Map<number, SoundDef>;

    public constructor() {
        const dApi = DApi as any;
        dApi.create_sound = this.createSound;
        dApi.create_sound_raw = this.createSoundRaw;
        dApi.play_sound = this.playSound;
        dApi.stop_sound = this.stopSound;
        dApi.delete_sound = this.deleteSound;
        dApi.duplicate_sound = this.duplicateSound;
        dApi.set_volume = this.setVolume;
    }

    public initSound = (): void => {
        const audioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioContext) {
            return;
        }
        this.context = null;
        try {
            this.context = new AudioContext();
        } catch (exception) {
            console.error(exception);
        }
        this.sounds = new Map<number, SoundDef>();
    }

    public createSound = (id: number, data: Uint8Array): void => {
        if (!this.context) {
            return;
        }
        const buffer = this.decodeAudioData(this.context, data.buffer);
        this.sounds.set(id, {
            buffer,
            gain: this.context.createGain(),
            panner: StereoPannerNode && new StereoPannerNode(this.context, { pan: 0 })
        });
    }

    public createSoundRaw = (id: number, data: Uint8Array, length: number, channels: number, rate: number): void => {
        if (!this.context) {
            return;
        }
        const buffer = this.context.createBuffer(channels, length, rate);
        for (let iter = 0; iter < channels; ++iter) {
            buffer.getChannelData(iter).set(data.subarray(iter * length, iter * length + length));
        }
        this.sounds.set(id, {
            buffer: Promise.resolve(buffer),
            gain: this.context.createGain(),
            panner: StereoPannerNode && new StereoPannerNode(this.context, { pan: 0 })
        });
    }

    public duplicateSound = (id: number, srcId: number): void => {
        if (!this.context) {
            return;
        }
        const src = this.sounds.get(srcId);
        if (!src) {
            return;
        }
        this.sounds.set(id, {
            buffer: src.buffer,
            gain: this.context.createGain(),
            panner: StereoPannerNode && new StereoPannerNode(this.context, { pan: 0 })
        });
    }

    public playSound = (id: number, volume: number, pan: number, loop: boolean): void => {
        const src = this.sounds.get(id);
        if (src) {
            if (src.source) {
                src.source.then(source => { source.stop(); }, (reason: unknown) => { console.error(reason); });
            }
            src.gain.gain.value = 2.0 ** (volume / 1000.0);
            const relVolume = 2.0 ** (pan / 1000.0);
            if (src.panner) {
                src.panner.pan.value = 1.0 - 2.0 / (1.0 + relVolume);
            }
            src.source = src.buffer.then(buffer => {
                const source = this.context.createBufferSource();
                source.buffer = buffer;
                source.loop = Boolean(loop);
                let node = source.connect(src.gain);
                if (src.panner) {
                    node = node.connect(src.panner);
                }
                node.connect(this.context.destination);
                source.start();
                return source;
            });
        }
    }

    public stopSound = (id: number): void => {
        const src = this.sounds.get(id);
        if (src?.source) {
            src.source.then(source => { source.stop(); }, (reason: unknown) => { console.error(reason); });
            delete src.source;
        }
    }

    public deleteSound = (id: number): void => {
        const src = this.sounds.get(id);
        if (src?.source) {
            src.source.then(source => { source.stop(); }, (reason: unknown) => { console.error(reason); });
        }
        this.sounds.delete(id);
    }

    public setVolume = (id: number, volume: number): void => {
        const src = this.sounds.get(id);
        if (src) {
            src.gain.gain.value = 2.0 ** (volume / 1000.0);
        }
    }

    private readonly decodeAudioData = async (context: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> =>
        new Promise((resolve, reject): void => {
            context.decodeAudioData(buffer, resolve, reject);
        })
}
