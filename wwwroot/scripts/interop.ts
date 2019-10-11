
//TODO master list:
//GitHub page
//Compress .mpq
//Move as much as possible from TS/JS to C#
//Add more TS type annotations (noImplicitAny)
//Use AOT compilation/non-Mono runtime/threads (Worker) when available
//Memory leak?
//Multiplayer?
//Touch? Low priority

declare const axios: any;

class Interop {
    private _webassembly: Webassembly;
    private _graphics: Graphics;
    private _sound: Sound;
    private _fileStore: FileStore;
    private _dotNetReference;

    constructor() {
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

    public get webassembly(): Webassembly {
        return this._webassembly;
    }

    public get graphics(): Graphics {
        return this._graphics;
    }

    public get sound(): Sound {
        return this._sound;
    }

    public get fileStore(): FileStore {
        return this._fileStore;
    }

    public get dotNetReference() {
        return this._dotNetReference;
    }

    public addEventListeners = (): void => {
        //TODO: preventDefault in Blazor as soon as supported
        window.addEventListener('resize', () => this._dotNetReference.invokeMethodAsync('OnResize', this.getCanvasRect()));

        const main = document.getElementById('main');
        main.addEventListener('drop', (e: DragEvent) => this._fileStore.onDropFile(e));
        main.addEventListener('dragover', (e: DragEvent) => e.preventDefault());

        const canvas = document.getElementById('canvas');
        canvas.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.keyCode === 8 || e.keyCode === 9 || (e.keyCode >= 112 && e.keyCode <= 119))
                e.preventDefault();
        });
        canvas.addEventListener('contextmenu', (e: Event) => e.preventDefault());
    }

    private download = async (url: string, sizes: number[]): Promise<ArrayBuffer> => {
        const response = await axios.request({
            url: url,
            responseType: 'arraybuffer',
            onDownloadProgress: e => this._dotNetReference.invokeMethodAsync('OnProgress', new Progress('Downloading...', e.loaded, e.total || sizes[1])),
            headers: { 'Cache-Control': 'max-age=31536000' }
        });
        return response.data;
    }

    public downloadAndUpdateIndexedDb = async (url: string, name: string, sizes: number[]): Promise<number> => {
        const arrayBuffer = await this.download(url, sizes);
        const array = await this._fileStore.updateIndexedDbFromArrayBuffer(name, arrayBuffer);
        this._fileStore.setFile(name, array);
        return arrayBuffer.byteLength;
    }

    public getCanvasRect = (): ClientRect => {
        const canvas = document.getElementById('canvas');
        return canvas.getBoundingClientRect();
    }

    public reload = (): void => {
        window.location.reload();
    }

    public openKeyboard = (...args): void => {
        //Do nothing
    }

    public closeKeyboard = (): void => {
        //Do nothing
    }

    public exitError = (error): void => {
        throw Error(error);
    }

    public exitGame = (): void => {
        this._dotNetReference.invokeMethodAsync('OnExit');
    }

    public currentSaveId = (id: number): void => {
        this._dotNetReference.invokeMethodAsync('SetSaveName', id);
    }

    public storeDotNetReference = (dotNetReference): void => {
        this._dotNetReference = dotNetReference;
    }

    public clickDownloadLink = (element: HTMLElement, download: string, href: string): void => {
        element.setAttribute('download', download);
        element.setAttribute('href', href);
        element.click();
        element.removeAttribute('download');
        element.removeAttribute('href');
    }

    public setCursor = (x: number, y: number): void => {
        this._dotNetReference.invokeMethodAsync('SetCursorPos', x, y);
    }
}

const windowAny = window as any;
windowAny.DApi = {};
windowAny.interop = new Interop();

const getInterop = (): Interop => windowAny.interop;
