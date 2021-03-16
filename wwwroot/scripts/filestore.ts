
declare const IdbKvStore: any;

interface FileDef {
    name: string;
    data: Uint8Array;
}

class FileStore {
    private store: typeof IdbKvStore;
    private files: Map<string, Uint8Array>;
    private dropFile: File;

    constructor() {
        this.files = new Map<string, Uint8Array>();

        windowAny.DApi.get_file_size = this.getFilesize;
        windowAny.DApi.get_file_contents = this.getFileContents;
        windowAny.DApi.put_file_contents = this.putFileContents;
        windowAny.DApi.remove_file = this.removeFile;
    }

    //Dummy parameter for minification
    public initIndexedDb = async (dummy: any): Promise<void> => {
        this.store = new IdbKvStore('diablo_fs');
        for (let [name, data] of Object.entries(await this.store.json()))
            this.files.set(name.toLowerCase(), data as Uint8Array);
    }

    public updateIndexedDbFromUint8Array = async (name: string, array: Uint8Array): Promise<void> => {
        await this.store.set(name, array);
    }

    public readIndexedDb = async (name: string): Promise<string> => {
        const array = await this.store.get(name.toLowerCase());
        return Helper.fromUint8ArrayToBase64(array);
    }

    public indexedDbHasFile = async (name: string): Promise<boolean> => {
        const file = await this.store.get(name.toLowerCase());
        return (file) ? true : false;
    }

    public storeSpawnUnmarshalledBegin = async (address: number, length: number): Promise<void> => {
        const arrayBuffer = windowAny.Module.HEAPU8.subarray(address, address + length);
        const array = new Uint8Array(arrayBuffer);
        const name = 'spawn.mpq';
        await this.store.set(name, array);
        this.files.set(name, array);
        getInterop().dotNetReference.invokeMethodAsync('StoreSpawnUnmarshalledEnd');
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

    private getFileFromInput = async (name: string): Promise<FileDef> => {
        const input = document.getElementById(name) as HTMLInputElement;
        const file = input.files[0];
        const filename = file.name.toLowerCase();
        const array = new Uint8Array(await this.readFile(file));
        return { name: filename, data: array };
    }

    public isDropFile = (event: DragEvent): boolean => {
        const items = event.dataTransfer.items;
        if (items)
            for (let i = 0; i < items.length; ++i)
                if (items[i].kind === 'file')
                    return true;
        if (event.dataTransfer.files.length)
            return true;
        return false;
    }

    public onDropFile = (event: DragEvent): void => {
        this.dropFile = this.getDropFile(event);
        if (this.dropFile) {
            event.preventDefault();
            getInterop().dotNetReference.invokeMethodAsync('Start', this.dropFile.name.toLowerCase(), true);
        }
    }

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

    //Dummy parameter for minification
    public setDropFile = async (dummy: any): Promise<void> => {
        const array = new Uint8Array(await this.readFile(this.dropFile));
        this.files.set(this.dropFile.name.toLowerCase(), array);
        this.dropFile = null;
    }

    //Dummy parameter for minification
    public setInputFile = async (dummy: any): Promise<void> => {
        const fileDef = await this.getFileFromInput('mpqInput');
        this.files.set(fileDef.name, fileDef.data);
    }

    //Dummy parameter for minification
    public uploadFile = async (dummy: any): Promise<void> => {
        const fileDef = await this.getFileFromInput('saveInput');
        this.files.set(fileDef.name, fileDef.data);
        this.store.set(fileDef.name, fileDef.data);
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

    //public updateIndexedDb = async (name: string, base64: string): Promise<void> => {
    //    const array = Helper.fromBase64ToUint8Array(base64);
    //    await this.store.set(name, array);
    //}

    //public updateIndexedDbFromArrayBuffer = async (name: string, buffer: ArrayBuffer): Promise<Uint8Array> => {
    //    const array = new Uint8Array(buffer);
    //    await this.store.set(name, array);
    //    return array;
    //}

    //public downloadFile = async (name: string): Promise<void> => {
    //    const file = await this.store.get(name.toLowerCase());
    //    if (!file)
    //        return;
    //    const blob = new Blob([file], { type: 'binary/octet-stream' });
    //    const url = URL.createObjectURL(blob);
    //    const link = document.createElement('a');
    //    link.href = url;
    //    link.download = name;
    //    document.body.appendChild(link);
    //    link.click();
    //    document.body.removeChild(link);
    //    URL.revokeObjectURL(url);
    //}

    //public setFile = (name: string, array: Uint8Array): void => {
    //    this.files.set(name.toLowerCase(), array);
    //}
}
