
declare const Diablo: any;
declare const DiabloSpawn: any;

class Webassembly {
    private wasm: any;

    public initWebAssemblyUnmarshalledBegin = async (isSpawn: boolean, address: number, length: number): Promise<void> => {
        const array = windowAny.Module.HEAPU8.subarray(address, address + length);
        this.wasm = await (isSpawn ? DiabloSpawn : Diablo)({ wasmBinary: array }).ready;
        getInterop().dotNetReference.invokeMethodAsync('InitWebAssemblyUnmarshalledEnd');
    }

    public dapiInit = (currentDateTime: number, offScreen: number, version0: number, version1: number, version2: number): void => {
        if (this.wasm)
            this.wasm._DApi_Init(currentDateTime, offScreen, version0, version1, version2);
    }

    public dapiMouse = (action: number, button: number, eventModifiers: number, x: number, y: number): void => {
        if (this.wasm)
            this.wasm._DApi_Mouse(action, button, eventModifiers, x, y);
    }

    public dapiKey = (action: number, eventModifiers: number, key: number): void => {
        if (this.wasm)
            this.wasm._DApi_Key(action, eventModifiers, key);
    }

    public dapiChar = (chr: number): void => {
        if (this.wasm)
            this.wasm._DApi_Char(chr);
    }

    public callApi = (func: string, ...params: string[]): void => {
        if (!this.wasm)
            return;

        Helper.tryApi((): void => {
            if (func !== "text")
                this.wasm["_" + func](...params);
            else {
                const ptr = this.wasm._DApi_SyncTextPtr();
                const text = params[0];
                const length = Math.min(text.length, 255);
                const heap = this.wasm.HEAPU8;
                for (let i = 0; i < length; ++i)
                    heap[ptr + i] = text.charCodeAt(i);
                heap[ptr + length] = 0;
                this.wasm._DApi_SyncText(params[1]);
            }
        });
    }

    //public initWebAssembly = async (isSpawn: boolean, base64: string): Promise<void> => {
    //    const arrayBuffer = Helper.fromBase64ToUint8Array(base64).buffer;
    //    this.wasm = await (isSpawn ? DiabloSpawn : Diablo)({ wasmBinary: arrayBuffer }).ready;
    //}

    //public snetInitWebsocket = (): void => {
    //    if (this.wasm)
    //        this.wasm._SNet_InitWebsocket();
    //}
}
