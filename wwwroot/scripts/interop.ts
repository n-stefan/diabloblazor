
//TODO master list:
//Move as much as possible from TS to C#
//Use AOT compilation/non-Mono runtime/threads (Worker) when available
//Compress .mpq?
//Multiplayer?
//Touch? Low priority

//declare const axios: any;

class Interop {
    private _webassembly: Webassembly;
    private _graphics: Graphics;
    private _sound: Sound;
    private _fileStore: FileStore;
    private _canvas: HTMLCanvasElement;
    private _dotNetReference: any;

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

    private get canvas(): HTMLCanvasElement {
        if (!this._canvas)
            this._canvas = document.getElementById('canvas') as HTMLCanvasElement;
        return this._canvas;
    }

    public get dotNetReference() {
        return this._dotNetReference;
    }

    public addEventListeners = (): void => {
        //TODO: preventDefault in Blazor as soon as supported
        window.addEventListener('resize', (): void => this._dotNetReference.invokeMethodAsync('OnResize', this.getCanvasRect()));

        const main = document.getElementById('main');
        main.addEventListener('drop', (e: DragEvent): void => this._fileStore.onDropFile(e));
        main.addEventListener('dragover', (e: DragEvent): void => {
            if (this._fileStore.isDropFile(e))
                e.preventDefault();
        });

        this.canvas.addEventListener('keydown', (e: KeyboardEvent): void => {
            if (e.keyCode === 8 || e.keyCode === 9 || (e.keyCode >= 112 && e.keyCode <= 119))
                e.preventDefault();
        });
        this.canvas.addEventListener('contextmenu', (e: Event): void => e.preventDefault());
    }

    //private download = async (url: string, sizes: number[]): Promise<ArrayBuffer> => {
    //    const response = await axios.request({
    //        url: url,
    //        responseType: 'arraybuffer',
    //        onDownloadProgress: (e: ProgressEvent): void => this._dotNetReference.invokeMethodAsync('OnProgress', new Progress('Downloading...', e.loaded, e.total || sizes[1])),
    //        headers: { 'Cache-Control': 'max-age=31536000' }
    //    });
    //    return response.data;
    //}

    //public downloadAndUpdateIndexedDb = async (url: string, name: string, sizes: number[]): Promise<number> => {
    //    const arrayBuffer = await this.download(url, sizes);
    //    const array = await this._fileStore.updateIndexedDbFromArrayBuffer(name, arrayBuffer);
    //    this._fileStore.setFile(name, array);
    //    return arrayBuffer.byteLength;
    //}

    public getCanvasRect = (): ClientRect => {
        return this.canvas.getBoundingClientRect();
    }

    public reload = (): void => {
        window.location.reload();
    }

    public openKeyboard = (...args: number[]): void => {
        //Do nothing
    }

    public closeKeyboard = (): void => {
        //Do nothing
    }

    public exitError = (error: string): void => {
        throw Error(error);
    }

    public exitGame = (): void => {
        this._dotNetReference.invokeMethodAsync('OnExit');
    }

    public currentSaveId = (id: number): void => {
        this._dotNetReference.invokeMethodAsync('SetSaveName', id);
    }

    public storeDotNetReference = (dotNetReference: any): void => {
        this._dotNetReference = dotNetReference;
    }

    public setCursor = (x: number, y: number): void => {
        this._dotNetReference.invokeMethodAsync('SetCursorPos', x, y);
    }

    public clickDownloadLink = (element: HTMLElement, download: string, href: string): void => {
        element.setAttribute('download', download);
        element.setAttribute('href', href);
        element.click();
        element.removeAttribute('download');
        element.removeAttribute('href');
    }
}

const windowAny = window as any;
windowAny.DApi = {};
windowAny.interop = new Interop();

const getInterop = (): Interop => windowAny.interop;
