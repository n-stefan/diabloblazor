
declare const IdbKvStore: any;

class FileStore {
    private store; //: IdbKvStore;
    private files: Map<string, Uint8Array>;
    private dropFile: File;

    constructor() {
        this.files = new Map<string, Uint8Array>();

        windowAny.DApi.get_file_size = this.getFilesizeFromPath;
        windowAny.DApi.get_file_contents = this.getFileContents;
        windowAny.DApi.put_file_contents = this.putFileContents;
        windowAny.DApi.remove_file = this.removeFile;
    }

    public initIndexedDb = async (): Promise<void> => {
        this.store = new IdbKvStore('diablo_fs');
        for (let [name, data] of Object.entries(await this.store.json())) {
            this.files.set(name, data as Uint8Array);
        }
    }

    public updateIndexedDb = async (name: string, base64: string): Promise<void> => {
        const array = Helper.fromBase64ToUint8Array(base64);
        await this.store.set(name, array);
    }

    public updateIndexedDbFromUint8Array = async (name: string, data: Uint8Array): Promise<void> => {
        await this.store.set(name, data);
    }

    public updateIndexedDbFromArrayBuffer = async (name: string, data: ArrayBuffer): Promise<Uint8Array> => {
        const array = new Uint8Array(data);
        await this.store.set(name, array);
        return array;
    }

    public getFiles = (): Map<string, Uint8Array> => {
        return this.files;
    }

    public setFile = (name: string, array: Uint8Array): void => {
        this.files.set(name, array);
    }

    private readFile = (file: File) => new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.onabort = () => reject();
        reader.readAsArrayBuffer(file);
    });

    private getDropFile = (event: DragEvent): File => {
        const items = event.dataTransfer.items;
        const files = event.dataTransfer.files;
        if (items)
            for (let i = 0; i < items.length; ++i)
                if (items[i].kind === 'file')
                    return items[i].getAsFile();
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
        if (this.dropFile) {
            getInterop().dotNetReference.invokeMethodAsync('Start', this.dropFile.name.toLowerCase());
        }
    }

    public hasFile = (name: string, sizes: number[]): boolean => {
        const file = this.files.get(name);
        if (!file)
            return false;
        else
            return sizes.includes(file.byteLength);
    }

    public getFilesize = (name: string): number => {
        const file = this.files.get(name);
        return file ? file.byteLength : 0;
    }

    public getFilesizeFromPath = (path: string): number => {
        const file = this.files.get(path.toLowerCase());
        return file ? file.byteLength : 0;
    }

    public getFileContents = (path: string, array: Uint8Array, offset: number): void => {
        const file = this.files.get(path.toLowerCase());
        if (file) {
            array.set(file.subarray(offset, offset + array.byteLength));
        }
    }

    public putFileContents = (path: string, array: Uint8Array): void => {
        path = path.toLowerCase();
        //if (!path.match(/^(spawn\d+\.sv|single_\d+\.sv|config\.ini)$/i)) {
        //  alert(`Bad file name: ${path}`);
        //}
        this.files.set(path, array);
        this.updateIndexedDbFromUint8Array(path, array);
    }

    public removeFile = async (path: string): Promise<void> => {
        path = path.toLowerCase();
        this.files.delete(path);
        await this.store.remove(path);
    }
}
