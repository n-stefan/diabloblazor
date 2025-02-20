﻿
var DApi = {}, interop = new class Interop {
    private readonly $graphics: Graphics;
    private readonly $sound: Sound;
    private readonly $fileStore: FileStore;
    private $canvas: HTMLCanvasElement;
    private $dotNetReference: any;

    public constructor() {
        this.$graphics = new Graphics();
        this.$sound = new Sound();
        this.$fileStore = new FileStore();
    }

    public get graphics(): Graphics {
        return this.$graphics;
    }

    public get sound(): Sound {
        return this.$sound;
    }

    public get fileStore(): FileStore {
        return this.$fileStore;
    }

    public get dotNetReference(): any {
        return this.$dotNetReference;
    }

    public setDotNetReference = (dotNetReference: any): void => {
        this.$dotNetReference = dotNetReference;
    }

    public addEventListeners = (): void => {
        window.addEventListener('resize', (): void => this.$dotNetReference.invokeMethodAsync('OnResize', this.getCanvasRect()));
        document.getElementById('main').addEventListener('drop', (event: DragEvent): void => { this.$fileStore.onDropFile(event); });
    }

    public getCanvasRect = (): DOMRect => {
        if (!this.$canvas) {
            this.$canvas = document.getElementById('canvas') as HTMLCanvasElement;
        }
        return this.$canvas.getBoundingClientRect();
    }

    public clickDownloadLink = (element: HTMLElement, download: string, href: string): void => {
        element.setAttribute('download', download);
        element.setAttribute('href', href);
        element.click();
        element.removeAttribute('download');
        element.removeAttribute('href');
    }
}
