
declare const Diablo: any;
declare const DiabloSpawn: any;

class Webassembly {
    private wasm;

    public initWebAssembly = async (isSpawn: boolean, base64: string): Promise<void> => {
        const arrayBuffer = Helper.fromBase64ToUint8Array(base64).buffer;
        this.wasm = await (isSpawn ? DiabloSpawn : Diablo)({ wasmBinary: arrayBuffer }).ready;
    }

    public snetInitWebsocket = (): void => {
        this.wasm._SNet_InitWebsocket();
    }

    public dapiInit = (currentDateTime: number, offScreen: number, version0: number, version1: number, version2: number): void => {
        this.wasm._DApi_Init(currentDateTime, offScreen, version0, version1, version2);
    }

    public dapiMouse = (action: number, button: number, eventModifiers: number, x: number, y: number): void => {
        this.wasm._DApi_Mouse(action, button, eventModifiers, x, y);
    }

    public dapiKey = (action: number, eventModifiers: number, key: number): void => {
        this.wasm._DApi_Key(action, eventModifiers, key);
    }

    public dapiChar = (chr: number): void => {
        this.wasm._DApi_Char(chr);
    }

    public callApi = (func, ...params): void => {
        Helper.tryApi(() => {
            const sound = getInterop().sound;
            const nested = (sound.audioBatch != null);
            if (!nested) {
                sound.audioBatch = [];
                sound.audioTransfer = [];
                //packetBatch = [];
            }
            if (func !== "text") {
                this.wasm["_" + func](...params);
            } else {
                const ptr = this.wasm._DApi_SyncTextPtr();
                const text = params[0];
                const length = Math.min(text.length, 255);
                const heap = this.wasm.HEAPU8;
                for (let i = 0; i < length; ++i) {
                    heap[ptr + i] = text.charCodeAt(i);
                }
                heap[ptr + length] = 0;
                this.wasm._DApi_SyncText(params[1]);
            }
            if (!nested) {
                if (sound.audioBatch.length) {
                    sound.maxSoundId = sound.maxBatchId;
                    //TODO
                    //worker.postMessage({ action: "audioBatch", batch: audioBatch }, audioTransfer);
                }
                //if (packetBatch.length) {
                //    worker.postMessage({ action: "packetBatch", batch: packetBatch }, packetBatch);
                //}
                sound.audioBatch = null;
                sound.audioTransfer = null;
                //packetBatch = null;
            }
        });
    }
}
