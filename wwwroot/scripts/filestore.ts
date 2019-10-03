
declare const IdbKvStore: any;

class FileStore {
    private store; //: IdbKvStore;
    private files: Map<string, Uint8Array>;
    private dropFile: File;

    constructor() {
        this.files = new Map<string, Uint8Array>();

        windowAny.DApi.get_file_size = this.getFilesize;
        windowAny.DApi.get_file_contents = this.getFileContents;
        windowAny.DApi.put_file_contents = this.putFileContents;
        windowAny.DApi.remove_file = this.removeFile;
    }

    public initIndexedDb = async (): Promise<void> => {
        this.store = new IdbKvStore('diablo_fs');
        for (let [name, data] of Object.entries(await this.store.json()))
            this.files.set(name.toLowerCase(), data as Uint8Array);
    }

    public updateIndexedDb = async (name: string, base64: string): Promise<void> => {
        const array = Helper.fromBase64ToUint8Array(base64);
        await this.store.set(name, array);
    }

    public updateIndexedDbFromUint8Array = async (name: string, array: Uint8Array): Promise<void> => {
        await this.store.set(name, array);
    }

    public updateIndexedDbFromArrayBuffer = async (name: string, buffer: ArrayBuffer): Promise<Uint8Array> => {
        const array = new Uint8Array(buffer);
        await this.store.set(name, array);
        return array;
    }

    public setFile = (name: string, array: Uint8Array): void => {
        this.files.set(name.toLowerCase(), array);
    }

    private readFile = (file: File) => new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.onabort = () => reject();
        reader.onprogress = (event: ProgressEvent<FileReader>) =>
            getInterop().dotNetReference.invokeMethodAsync('OnProgress', new Progress('Loading...', event.loaded, event.total));
        reader.readAsArrayBuffer(file);
    });

    private getDropFile = (event: DragEvent): File => {
        const items = event.dataTransfer.items;
        if (items)
            for (let i = 0; i < items.length; ++i)
                if (items[i].kind === 'file')
                    return items[i].getAsFile();
        const files = event.dataTransfer.files;
        if (files.length)
            return files[0];
    }

    public setInputFile = async (): Promise<void> => {
        const input = document.getElementById('loadFile') as HTMLInputElement;
        const file = input.files[0];
        const array = new Uint8Array(await this.readFile(file));
        this.files.set(file.name.toLowerCase(), array);
    }

    public setDropFile = async (): Promise<void> => {
        const array = new Uint8Array(await this.readFile(this.dropFile));
        this.files.set(this.dropFile.name.toLowerCase(), array);
        this.dropFile = null;
    }

    public onDropFile = (event: DragEvent): void => {
        this.dropFile = this.getDropFile(event);
        if (this.dropFile)
            getInterop().dotNetReference.invokeMethodAsync('Start', this.dropFile.name.toLowerCase(), true);
    }

    public hasFile = (name: string, sizes: number[]): boolean => {
        const file = this.files.get(name.toLowerCase());
        if (!file)
            return false;
        else if (sizes.length > 0)
            return sizes.includes(file.byteLength);
        else
            return true;
    }

    public getFilenames = (): string[] => {
        return [...this.files.keys()];
    }

    public getFilesize = (name: string): number => {
        const file = this.files.get(name.toLowerCase());
        return file ? file.byteLength : 0;
    }

    public getFileContents = (path: string, array: Uint8Array, offset: number): void => {
        const file = this.files.get(path.toLowerCase());
        if (file)
            array.set(file.subarray(offset, offset + array.byteLength));
    }

    public putFileContents = (path: string, array: Uint8Array): void => {
        path = path.toLowerCase();
        //if (!path.match(/^(spawn\d+\.sv|single_\d+\.sv|config\.ini)$/i))
        //  alert(`Bad file name: ${path}`);
        this.files.set(path, array);
        this.updateIndexedDbFromUint8Array(path, array);
    }

    public removeFile = async (path: string): Promise<void> => {
        path = path.toLowerCase();
        this.files.delete(path);
        await this.store.remove(path);
    }
}
