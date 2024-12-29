
class Interop {
    readonly #graphics: Graphics;
    readonly #sound: Sound;
    readonly #fileStore: FileStore;
    #canvas: HTMLCanvasElement;
    #dotNetReference: any;

    public constructor() {
        this.#graphics = new Graphics();
        this.#sound = new Sound();
        this.#fileStore = new FileStore();
    }

    public get graphics(): Graphics {
        return this.#graphics;
    }

    public get sound(): Sound {
        return this.#sound;
    }

    public get fileStore(): FileStore {
        return this.#fileStore;
    }

    private get canvas(): HTMLCanvasElement {
        if (!this.#canvas) {
            this.#canvas = document.getElementById('canvas') as HTMLCanvasElement;
        }
        return this.#canvas;
    }

    public get dotNetReference(): any {
        return this.#dotNetReference;
    }

    public setDotNetReference = (dotNetReference: any): void => {
        this.#dotNetReference = dotNetReference;
    }

    public addEventListeners = (): void => {
        window.addEventListener('resize', (): void => this.#dotNetReference.invokeMethodAsync('OnResize', this.getCanvasRect()));

        const main = document.getElementById('main');
        main.addEventListener('drop', (event: DragEvent): void => { this.#fileStore.onDropFile(event); });
    }

    public getCanvasRect = (): ClientRect =>
        this.canvas.getBoundingClientRect()

    public clickDownloadLink = (element: HTMLElement, download: string, href: string): void => {
        element.setAttribute('download', download);
        element.setAttribute('href', href);
        element.click();
        element.removeAttribute('download');
        element.removeAttribute('href');
    }
}

(<any>window).DApi = {};
(<any>window).interop = new Interop();
