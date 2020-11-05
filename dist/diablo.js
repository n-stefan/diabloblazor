class FileStore {
    constructor() {
        this.initIndexedDb = async () => {
            this.store = new IdbKvStore('diablo_fs');
            for (let [name, data] of Object.entries(await this.store.json()))
                this.files.set(name.toLowerCase(), data);
        };
        this.updateIndexedDbFromUint8Array = async (name, array) => {
            await this.store.set(name, array);
        };
        this.readIndexedDb = async (name) => {
            const array = await this.store.get(name.toLowerCase());
            return Helper.fromUint8ArrayToBase64(array);
        };
        this.indexedDbHasFile = async (name) => {
            const file = await this.store.get(name.toLowerCase());
            return (file) ? true : false;
        };
        this.storeSpawnUnmarshalledBegin = async (address, length) => {
            const arrayBuffer = windowAny.Module.HEAPU8.subarray(address, address + length);
            const array = new Uint8Array(arrayBuffer);
            const name = 'spawn.mpq';
            await this.store.set(name, array);
            this.files.set(name, array);
            getInterop().dotNetReference.invokeMethodAsync('StoreSpawnUnmarshalledEnd');
        };
        this.readFile = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.onabort = () => reject();
            reader.onprogress = (event) => getInterop().dotNetReference.invokeMethodAsync('OnProgress', new Progress('Loading...', event.loaded, event.total));
            reader.readAsArrayBuffer(file);
        });
        this.getFileFromInput = async (name) => {
            const input = document.getElementById(name);
            const file = input.files[0];
            const filename = file.name.toLowerCase();
            const array = new Uint8Array(await this.readFile(file));
            return { name: filename, data: array };
        };
        this.isDropFile = (event) => {
            const items = event.dataTransfer.items;
            if (items)
                for (let i = 0; i < items.length; ++i)
                    if (items[i].kind === 'file')
                        return true;
            if (event.dataTransfer.files.length)
                return true;
            return false;
        };
        this.onDropFile = (event) => {
            this.dropFile = this.getDropFile(event);
            if (this.dropFile) {
                event.preventDefault();
                getInterop().dotNetReference.invokeMethodAsync('Start', this.dropFile.name.toLowerCase(), true);
            }
        };
        this.getDropFile = (event) => {
            const items = event.dataTransfer.items;
            if (items)
                for (let i = 0; i < items.length; ++i)
                    if (items[i].kind === 'file')
                        return items[i].getAsFile();
            const files = event.dataTransfer.files;
            if (files.length)
                return files[0];
        };
        this.setDropFile = async () => {
            const array = new Uint8Array(await this.readFile(this.dropFile));
            this.files.set(this.dropFile.name.toLowerCase(), array);
            this.dropFile = null;
        };
        this.setInputFile = async () => {
            const fileDef = await this.getFileFromInput('mpqInput');
            this.files.set(fileDef.name, fileDef.data);
        };
        this.uploadFile = async () => {
            const fileDef = await this.getFileFromInput('saveInput');
            this.files.set(fileDef.name, fileDef.data);
            this.store.set(fileDef.name, fileDef.data);
        };
        this.hasFile = (name, sizes) => {
            const file = this.files.get(name.toLowerCase());
            if (!file)
                return false;
            else if (sizes.length > 0)
                return sizes.includes(file.byteLength);
            else
                return true;
        };
        this.getFilenames = () => {
            return [...this.files.keys()];
        };
        this.getFilesize = (name) => {
            const file = this.files.get(name.toLowerCase());
            return file ? file.byteLength : 0;
        };
        this.getFileContents = (name, array, offset) => {
            const file = this.files.get(name.toLowerCase());
            if (file)
                array.set(file.subarray(offset, offset + array.byteLength));
        };
        this.putFileContents = async (name, array) => {
            name = name.toLowerCase();
            this.files.set(name, array);
            await this.updateIndexedDbFromUint8Array(name, array);
        };
        this.removeFile = async (name) => {
            name = name.toLowerCase();
            this.files.delete(name);
            await this.store.remove(name);
        };
        this.getRenderInterval = () => {
            const value = localStorage.getItem('DiabloRenderInterval');
            return value ? parseInt(value) : 50;
        };
        this.setRenderInterval = (value) => {
            localStorage.setItem('DiabloRenderInterval', value.toString());
        };
        this.files = new Map();
        windowAny.DApi.get_file_size = this.getFilesize;
        windowAny.DApi.get_file_contents = this.getFileContents;
        windowAny.DApi.put_file_contents = this.putFileContents;
        windowAny.DApi.remove_file = this.removeFile;
    }
}
//# sourceMappingURL=filestore.js.map