
interface SoundDef {
    buffer: Promise<AudioBuffer>;
    gain: GainNode;
    panner: StereoPannerNode;
    source?: Promise<AudioBufferSourceNode>;
}

class Sound {
    private context: AudioContext;
    private sounds: Map<number, SoundDef>;

    constructor() {
        windowAny.DApi.create_sound = this.createSound;
        windowAny.DApi.create_sound_raw = this.createSoundRaw;
        windowAny.DApi.play_sound = this.playSound;
        windowAny.DApi.stop_sound = this.stopSound;
        windowAny.DApi.delete_sound = this.deleteSound;
        windowAny.DApi.duplicate_sound = this.duplicateSound;
        windowAny.DApi.set_volume = this.setVolume;
    }

    public initSound = (): void => {
        const AudioContext = window.AudioContext || windowAny.webkitAudioContext;
        //const StereoPannerNode = window.StereoPannerNode;
        if (!AudioContext)
            return;
        this.context = null;
        try {
            this.context = new AudioContext();
        } catch (e) {
        }
        this.sounds = new Map<number, SoundDef>();
    }

    public createSound = (id: number, data: Uint8Array): void => {
        if (!this.context)
            return;
        const buffer = this.decodeAudioData(this.context, data.buffer);
        this.sounds.set(id, {
            buffer,
            gain: this.context.createGain(),
            panner: StereoPannerNode && new StereoPannerNode(this.context, { pan: 0 })
        });
    }

    public createSoundRaw = (id: number, data: Uint8Array, length: number, channels: number, rate: number): void => {
        if (!this.context)
            return;
        const buffer = this.context.createBuffer(channels, length, rate);
        for (let i = 0; i < channels; ++i)
            buffer.getChannelData(i).set(data.subarray(i * length, i * length + length));
        this.sounds.set(id, {
            buffer: Promise.resolve(buffer),
            gain: this.context.createGain(),
            panner: StereoPannerNode && new StereoPannerNode(this.context, { pan: 0 })
        });
    }

    public duplicateSound = (id: number, srcId: number): void => {
        if (!this.context)
            return;
        const src = this.sounds.get(srcId);
        if (!src)
            return;
        this.sounds.set(id, {
            buffer: src.buffer,
            gain: this.context.createGain(),
            panner: StereoPannerNode && new StereoPannerNode(this.context, { pan: 0 })
        });
    }

    public playSound = (id: number, volume: number, pan: number, loop: boolean): void => {
        const src = this.sounds.get(id);
        if (src) {
            if (src.source)
                src.source.then(source => source.stop());
            src.gain.gain.value = Math.pow(2.0, volume / 1000.0);
            const relVolume = Math.pow(2.0, pan / 1000.0);
            if (src.panner)
                src.panner.pan.value = 1.0 - 2.0 / (1.0 + relVolume);
            src.source = src.buffer.then(buffer => {
                const source = this.context.createBufferSource();
                source.buffer = buffer;
                source.loop = !!loop;
                let node = source.connect(src.gain);
                if (src.panner)
                    node = node.connect(src.panner);
                node.connect(this.context.destination);
                source.start();
                return source;
            });
        }
    }

    public stopSound = (id: number): void => {
        const src = this.sounds.get(id);
        if (src && src.source) {
            src.source.then(source => source.stop());
            delete src.source;
        }
    }

    public deleteSound = (id: number): void => {
        const src = this.sounds.get(id);
        if (src && src.source)
            src.source.then(source => source.stop());
        this.sounds.delete(id);
    }

    public setVolume = (id: number, volume: number): void => {
        const src = this.sounds.get(id);
        if (src)
            src.gain.gain.value = Math.pow(2.0, volume / 1000.0);
    }

    private decodeAudioData = (context: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> => {
        return new Promise((resolve, reject): void => {
            context.decodeAudioData(buffer, resolve, reject);
        });
    }
}
