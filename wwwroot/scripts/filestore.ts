
declare const IdbKvStore: any;

interface FileDef {
    name: string;
    data: Uint8Array;
}

class FileStore {
    private store: any; //: IdbKvStore;
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

    public readIndexedDb = async (name: string): Promise<string> => {
        const array = await this.store.get(name.toLowerCase());
        return Helper.fromUint8ArrayToBase64(array);
    }

    public indexedDbHasFile = async (name: string): Promise<boolean> => {
        const file = await this.store.get(name.toLowerCase());
        return (file) ? true : false;
    }

    public downloadFile = async (name: string): Promise<void> => {
        const file = await this.store.get(name.toLowerCase());
        if (!file)
            return;
        const blob = new Blob([file], { type: 'binary/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    private setFileFromInput = async (name: string): Promise<FileDef> => {
        const input = document.getElementById(name) as HTMLInputElement;
        const file = input.files[0];
        const array = new Uint8Array(await this.readFile(file));
        const filename = file.name.toLowerCase();
        this.files.set(filename, array);
        return { name: filename, data: array };
    }

    public uploadFile = async (): Promise<void> => {
        const fileDef = await this.setFileFromInput('saveInput');
        this.store.set(fileDef.name, fileDef.data);
    }

    public setFile = (name: string, array: Uint8Array): void => {
        this.files.set(name.toLowerCase(), array);
    }

    private readFile = (file: File): Promise<ArrayBuffer> => new Promise<ArrayBuffer>((resolve, reject): void => {
        const reader = new FileReader();
        reader.onload = (): void => resolve(reader.result as ArrayBuffer);
        reader.onerror = (): void => reject(reader.error);
        reader.onabort = (): void => reject();
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
        await this.setFileFromInput('mpqInput');
    }

    public setDropFile = async (): Promise<void> => {
        const array = new Uint8Array(await this.readFile(this.dropFile));
        this.files.set(this.dropFile.name.toLowerCase(), array);
        this.dropFile = null;
    }

    public onDropFile = (event: DragEvent): void => {
        this.dropFile = this.getDropFile(event);
        if (this.dropFile) {
            event.preventDefault();
            getInterop().dotNetReference.invokeMethodAsync('Start', this.dropFile.name.toLowerCase(), true);
        }
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

    public getFileContents = (name: string, array: Uint8Array, offset: number): void => {
        const file = this.files.get(name.toLowerCase());
        if (file)
            array.set(file.subarray(offset, offset + array.byteLength));
    }

    public putFileContents = async (name: string, array: Uint8Array): Promise<void> => {
        name = name.toLowerCase();
        //if (!name.match(/^(spawn\d+\.sv|single_\d+\.sv|config\.ini)$/i))
        //  alert(`Bad file name: ${name}`);
        this.files.set(name, array);
        await this.updateIndexedDbFromUint8Array(name, array);
    }

    public removeFile = async (name: string): Promise<void> => {
        name = name.toLowerCase();
        this.files.delete(name);
        await this.store.remove(name);
    }

    public getRenderInterval = (): number => {
        const value = localStorage.getItem('DiabloRenderInterval');
        return value ? parseInt(value) : 50;
    }

    public setRenderInterval = (value: number): void => {
        localStorage.setItem('DiabloRenderInterval', value.toString());
    }
}
