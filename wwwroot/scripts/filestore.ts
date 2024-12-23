
declare const IdbKvStore: any;
declare const MemoryView: any;

interface FileDef {
    name: string;
    data: Uint8Array;
}

class FileStore {
    private store: typeof IdbKvStore;
    private dropFile: File;

    //Dummy parameter for minification
    public initIndexedDb = async (dummy: any): Promise<void> => {
        this.store = new IdbKvStore('diablo_fs');
        for (const [name, data] of Object.entries(await this.store.json()))
            getInterop().dotNetReference.invokeMethod('SetFile', name.toLowerCase(), data as Uint8Array);
    }

    public readIndexedDb = async (name: string): Promise<Uint8Array> =>
        await this.store.get(name.toLowerCase())

    public indexedDbHasFile = async (name: string): Promise<boolean> => {
        const file = await this.store.get(name.toLowerCase());
        return Boolean(file);
    }

    public storeIndexedDb = async (name: string, view: typeof MemoryView): Promise<void> => {
        try {
            const array = new Uint8Array(view._unsafe_create_view());
            await this.store.set(name, array);
        } finally {
            view.dispose();
        }
    }

    public removeIndexedDb = async (name: string): Promise<void> => {
        await this.store.remove(name);
    }

    private readonly readFile = async (file: File): Promise<ArrayBuffer> => new Promise<ArrayBuffer>((resolve, reject): void => {
        const reader = new FileReader();
        reader.onload = (): void => { resolve(reader.result as ArrayBuffer); };
        reader.onerror = (): void => { reject(reader.error); };
        reader.onabort = (): void => { reject(); };
        reader.onprogress = (event: ProgressEvent<FileReader>): void =>
            getInterop().dotNetReference.invokeMethod('OnProgress', new Progress('Loading...', event.loaded, event.total));
        reader.readAsArrayBuffer(file);
    });

    public onDropFile = (event: DragEvent): void => {
        this.dropFile = this.getDropFile(event);
        if (this.dropFile) {
            event.preventDefault();
            getInterop().dotNetReference.invokeMethodAsync('Start', this.dropFile.name.toLowerCase(), true);
        }
    }

    private readonly getDropFile = (event: DragEvent): File | null => {
        const items = event.dataTransfer.items;
        if (items)
            for (let i = 0; i < items.length; ++i)
                if (items[i].kind === 'file')
                    return items[i].getAsFile();
        const files = event.dataTransfer.files;
        if (files.length)
            return files[0];
        return null;
    }

    //Dummy parameter for minification
    public setDropFile = async (dummy: any): Promise<void> => {
        const array = new Uint8Array(await this.readFile(this.dropFile));
        getInterop().dotNetReference.invokeMethod('SetFile', this.dropFile.name.toLowerCase(), array);
        this.dropFile = null;
    }

    public getRenderInterval = (): number => {
        const value = localStorage.getItem('DiabloRenderInterval');
        return value ? parseInt(value, 10) : 50;
    }

    public setRenderInterval = (value: number): void => {
        localStorage.setItem('DiabloRenderInterval', value.toString());
    }
}
