class Webassembly {
    constructor() {
        this.initWebAssemblyUnmarshalledBegin = async (isSpawn, address, length) => {
            const array = windowAny.Module.HEAPU8.subarray(address, address + length);
            this.wasm = await (isSpawn ? DiabloSpawn : Diablo)({ wasmBinary: array }).ready;
            getInterop().dotNetReference.invokeMethodAsync('InitWebAssemblyUnmarshalledEnd');
        };
        this.dapiInit = (currentDateTime, offScreen, version0, version1, version2) => {
            if (this.wasm)
                this.wasm._DApi_Init(currentDateTime, offScreen, version0, version1, version2);
        };
        this.dapiMouse = (action, button, eventModifiers, x, y) => {
            if (this.wasm)
                this.wasm._DApi_Mouse(action, button, eventModifiers, x, y);
        };
        this.dapiKey = (action, eventModifiers, key) => {
            if (this.wasm)
                this.wasm._DApi_Key(action, eventModifiers, key);
        };
        this.dapiChar = (chr) => {
            if (this.wasm)
                this.wasm._DApi_Char(chr);
        };
        this.callApi = (func, ...params) => {
            if (!this.wasm)
                return;
            Helper.tryApi(() => {
                if (func !== "text") {
                    this.wasm["_" + func](...params);
                }
                else {
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
            });
        };
    }
}
//# sourceMappingURL=webassembly.js.map
class FileStore {
    constructor() {
        this.initIndexedDb = async () => {
            this.store = new IdbKvStore('diablo_fs');
            for (let [name, data] of Object.entries(await this.store.json()))
                this.files.set(name.toLowerCase(), data);
        };
        this.updateIndexedDbFromUint8Array = async (name, array) => {
            await this.store.set(name, array);
        };
        this.readIndexedDb = async (name) => {
            const array = await this.store.get(name.toLowerCase());
            return Helper.fromUint8ArrayToBase64(array);
        };
        this.indexedDbHasFile = async (name) => {
            const file = await this.store.get(name.toLowerCase());
            return (file) ? true : false;
        };
        this.storeSpawnUnmarshalledBegin = async (address, length) => {
            const arrayBuffer = windowAny.Module.HEAPU8.subarray(address, address + length);
            const array = new Uint8Array(arrayBuffer);
            const name = 'spawn.mpq';
            await this.store.set(name, array);
            this.files.set(name, array);
            getInterop().dotNetReference.invokeMethodAsync('StoreSpawnUnmarshalledEnd');
        };
        this.readFile = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.onabort = () => reject();
            reader.onprogress = (event) => getInterop().dotNetReference.invokeMethodAsync('OnProgress', new Progress('Loading...', event.loaded, event.total));
            reader.readAsArrayBuffer(file);
        });
        this.getFileFromInput = async (name) => {
            const input = document.getElementById(name);
            const file = input.files[0];
            const filename = file.name.toLowerCase();
            const array = new Uint8Array(await this.readFile(file));
            return { name: filename, data: array };
        };
        this.isDropFile = (event) => {
            const items = event.dataTransfer.items;
            if (items)
                for (let i = 0; i < items.length; ++i)
                    if (items[i].kind === 'file')
                        return true;
            if (event.dataTransfer.files.length)
                return true;
            return false;
        };
        this.onDropFile = (event) => {
            this.dropFile = this.getDropFile(event);
            if (this.dropFile) {
                event.preventDefault();
                getInterop().dotNetReference.invokeMethodAsync('Start', this.dropFile.name.toLowerCase(), true);
            }
        };
        this.getDropFile = (event) => {
            const items = event.dataTransfer.items;
            if (items)
                for (let i = 0; i < items.length; ++i)
                    if (items[i].kind === 'file')
                        return items[i].getAsFile();
            const files = event.dataTransfer.files;
            if (files.length)
                return files[0];
        };
        this.setDropFile = async () => {
            const array = new Uint8Array(await this.readFile(this.dropFile));
            this.files.set(this.dropFile.name.toLowerCase(), array);
            this.dropFile = null;
        };
        this.setInputFile = async () => {
            const fileDef = await this.getFileFromInput('mpqInput');
            this.files.set(fileDef.name, fileDef.data);
        };
        this.uploadFile = async () => {
            const fileDef = await this.getFileFromInput('saveInput');
            this.files.set(fileDef.name, fileDef.data);
            this.store.set(fileDef.name, fileDef.data);
        };
        this.hasFile = (name, sizes) => {
            const file = this.files.get(name.toLowerCase());
            if (!file)
                return false;
            else if (sizes.length > 0)
                return sizes.includes(file.byteLength);
            else
                return true;
        };
        this.getFilenames = () => {
            return [...this.files.keys()];
        };
        this.getFilesize = (name) => {
            const file = this.files.get(name.toLowerCase());
            return file ? file.byteLength : 0;
        };
        this.getFileContents = (name, array, offset) => {
            const file = this.files.get(name.toLowerCase());
            if (file)
                array.set(file.subarray(offset, offset + array.byteLength));
        };
        this.putFileContents = async (name, array) => {
            name = name.toLowerCase();
            this.files.set(name, array);
            await this.updateIndexedDbFromUint8Array(name, array);
        };
        this.removeFile = async (name) => {
            name = name.toLowerCase();
            this.files.delete(name);
            await this.store.remove(name);
        };
        this.getRenderInterval = () => {
            const value = localStorage.getItem('DiabloRenderInterval');
            return value ? parseInt(value) : 50;
        };
        this.setRenderInterval = (value) => {
            localStorage.setItem('DiabloRenderInterval', value.toString());
        };
        this.files = new Map();
        windowAny.DApi.get_file_size = this.getFilesize;
        windowAny.DApi.get_file_contents = this.getFileContents;
        windowAny.DApi.put_file_contents = this.putFileContents;
        windowAny.DApi.remove_file = this.removeFile;
    }
}
//# sourceMappingURL=filestore.js.map
class Interop {
    constructor() {
        this.setDotNetReference = (dotNetReference) => {
            this._dotNetReference = dotNetReference;
        };
        this.addEventListeners = () => {
            window.addEventListener('resize', () => this._dotNetReference.invokeMethodAsync('OnResize', this.getCanvasRect()));
            const main = document.getElementById('main');
            main.addEventListener('drop', (e) => this._fileStore.onDropFile(e));
            main.addEventListener('dragover', (e) => {
                if (this._fileStore.isDropFile(e))
                    e.preventDefault();
            });
            this.canvas.addEventListener('keydown', (e) => {
                if (e.keyCode === 8 || e.keyCode === 9 || (e.keyCode >= 112 && e.keyCode <= 119))
                    e.preventDefault();
            });
            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        };
        this.getCanvasRect = () => {
            return this.canvas.getBoundingClientRect();
        };
        this.openKeyboard = (...args) => {
        };
        this.closeKeyboard = () => {
        };
        this.exitError = (error) => {
            throw Error(error);
        };
        this.exitGame = () => {
            this._dotNetReference.invokeMethodAsync('OnExit');
        };
        this.currentSaveId = (id) => {
            this._dotNetReference.invokeMethodAsync('SetSaveName', id);
        };
        this.setCursor = (x, y) => {
            this._webassembly.dapiMouse(0, 0, 0, x, y);
        };
        this.reload = () => {
            window.location.reload();
        };
        this.clickDownloadLink = (element, download, href) => {
            element.setAttribute('download', download);
            element.setAttribute('href', href);
            element.click();
            element.removeAttribute('download');
            element.removeAttribute('href');
        };
        this._webassembly = new Webassembly();
        this._graphics = new Graphics();
        this._sound = new Sound();
        this._fileStore = new FileStore();
        windowAny.DApi.open_keyboard = this.openKeyboard;
        windowAny.DApi.close_keyboard = this.closeKeyboard;
        windowAny.DApi.set_cursor = this.setCursor;
        windowAny.DApi.current_save_id = this.currentSaveId;
        windowAny.DApi.exit_game = this.exitGame;
        windowAny.DApi.exit_error = this.exitError;
    }
    get webassembly() {
        return this._webassembly;
    }
    get graphics() {
        return this._graphics;
    }
    get sound() {
        return this._sound;
    }
    get fileStore() {
        return this._fileStore;
    }
    get canvas() {
        if (!this._canvas)
            this._canvas = document.getElementById('canvas');
        return this._canvas;
    }
    get dotNetReference() {
        return this._dotNetReference;
    }
}
const windowAny = window;
windowAny.DApi = {};
windowAny.interop = new Interop();
const getInterop = () => windowAny.interop;
//# sourceMappingURL=interop.js.map