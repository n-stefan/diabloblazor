﻿
class Interop {
    private _graphics: Graphics;
    private _sound: Sound;
    private _fileStore: FileStore;
    private _canvas: HTMLCanvasElement;
    private _dotNetReference: any;

    constructor() {
        this._graphics = new Graphics();
        this._sound = new Sound();
        this._fileStore = new FileStore();
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

    public setDotNetReference = (dotNetReference: any): void => {
        this._dotNetReference = dotNetReference;
    }

    public addEventListeners = (): void => {
        window.addEventListener('resize', (): void => this._dotNetReference.invokeMethodAsync('OnResize', this.getCanvasRect()));

        const main = document.getElementById('main');
        main.addEventListener('drop', (e: DragEvent): void => this._fileStore.onDropFile(e));
    }

    public getCanvasRect = (): ClientRect => {
        return this.canvas.getBoundingClientRect();
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
