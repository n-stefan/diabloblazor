namespace diabloblazor.Services;

public class Interop
{
    private readonly IJSRuntime _jsRuntime;
    private readonly IJSInProcessRuntime _jsInProcessRuntime;
    private readonly IJSUnmarshalledRuntime _jsUnmarshalledRuntime;

    public Interop(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
        _jsInProcessRuntime = (jsRuntime as IJSInProcessRuntime)!;
        _jsUnmarshalledRuntime = (jsRuntime as IJSUnmarshalledRuntime)!;
    }

    public void Alert(string message) =>
        _jsInProcessRuntime.InvokeVoid("alert", message);

    public bool Confirm(string message) =>
        _jsInProcessRuntime.Invoke<bool>("confirm", message);

    public ValueTask SetDotNetReference(DotNetObjectReference<Main> reference) =>
        _jsRuntime.InvokeVoidAsync("interop.setDotNetReference", reference);

    public ValueTask InitIndexedDb() =>
        _jsRuntime.InvokeVoidAsync("interop.fileStore.initIndexedDb");

    public ValueTask<byte[]> ReadIndexedDb(string name) =>
        _jsRuntime.InvokeAsync<byte[]>("interop.fileStore.readIndexedDb", name);

    public ValueTask<bool> IndexedDbHasFile(string name) =>
        _jsRuntime.InvokeAsync<bool>("interop.fileStore.indexedDbHasFile", name);

    public ValueTask ClickDownloadLink(ElementReference link, string download, string href) =>
        _jsRuntime.InvokeVoidAsync("interop.clickDownloadLink", link, download, href);

    public ValueTask UploadFile() =>
        _jsRuntime.InvokeVoidAsync("interop.fileStore.uploadFile");

    public ValueTask<bool> HasFile(string name, params int[] sizes) =>
        _jsRuntime.InvokeAsync<bool>("interop.fileStore.hasFile", name, sizes);

    public ValueTask<string[]> GetFilenames() =>
        _jsRuntime.InvokeAsync<string[]>("interop.fileStore.getFilenames");

    public ValueTask<int> GetFilesize(string name) =>
        _jsRuntime.InvokeAsync<int>("interop.fileStore.getFilesize", name);

    public ValueTask RemoveFile(string name) =>
        _jsRuntime.InvokeVoidAsync("interop.fileStore.removeFile", name);

    public ValueTask SetInputFile() =>
        _jsRuntime.InvokeVoidAsync("interop.fileStore.setInputFile");

    public ValueTask SetDropFile() =>
        _jsRuntime.InvokeVoidAsync("interop.fileStore.setDropFile");

    public ValueTask<int> GetRenderInterval() =>
        _jsRuntime.InvokeAsync<int>("interop.fileStore.getRenderInterval");

    public ValueTask SetRenderInterval(int renderInterval) =>
        _jsRuntime.InvokeVoidAsync("interop.fileStore.setRenderInterval", renderInterval);

    public GCHandle InitWebAssemblyUnmarshalledBegin(bool isSpawn, byte[] data)
    {
        if (data is null)
        {
            throw new ArgumentNullException(nameof(data));
        }

        var gameWasmHandle = GCHandle.Alloc(data, GCHandleType.Pinned);
        _jsUnmarshalledRuntime.InvokeUnmarshalled<bool, IntPtr, int, object>("interop.webassembly.initWebAssemblyUnmarshalledBegin",
            isSpawn, gameWasmHandle.AddrOfPinnedObject(), data.Length);
        return gameWasmHandle;
    }

    public GCHandle StoreSpawnUnmarshalledBegin(byte[] data)
    {
        if (data is null)
        {
            throw new ArgumentNullException(nameof(data));
        }

        var spawnMpqHandle = GCHandle.Alloc(data, GCHandleType.Pinned);
        _jsUnmarshalledRuntime.InvokeUnmarshalled<IntPtr, int, object>("interop.fileStore.storeSpawnUnmarshalledBegin", spawnMpqHandle.AddrOfPinnedObject(), data.Length);
        return spawnMpqHandle;
    }

    public ValueTask InitGraphics(bool offscreen) =>
        _jsRuntime.InvokeVoidAsync("interop.graphics.initGraphics", offscreen);

    public ValueTask InitSound() =>
        _jsRuntime.InvokeVoidAsync("interop.sound.initSound");

    public ValueTask DApiInit(double currentDateTime, int offScreen, int version0, int version1, int version2) =>
        _jsRuntime.InvokeVoidAsync("interop.webassembly.dapiInit", currentDateTime, offScreen, version0, version1, version2);

    public void DApiMouse(int action, int button, int eventModifiers, double x, double y) =>
        _jsInProcessRuntime.InvokeVoid("interop.webassembly.dapiMouse", action, button, eventModifiers, x, y);
    //_jsRuntime.InvokeVoidAsync("interop.webassembly.dapiMouse", action, button, eventModifiers, x, y);

    public void DApiKey(int action, int eventModifiers, int key) =>
        _jsInProcessRuntime.InvokeVoid("interop.webassembly.dapiKey", action, eventModifiers, key);
    //_jsRuntime.InvokeVoidAsync("interop.webassembly.dapiKey", action, eventModifiers, key);

    public void DApiChar(int chr) =>
        _jsInProcessRuntime.InvokeVoid("interop.webassembly.dapiChar", chr);
    //_jsRuntime.InvokeVoidAsync("interop.webassembly.dapiChar", chr);

    public ValueTask CallApi(string api, params object[] args) =>
        _jsRuntime.InvokeVoidAsync("interop.webassembly.callApi", api, args);

    public ValueTask<ClientRect> GetCanvasRect() =>
        _jsRuntime.InvokeAsync<ClientRect>("interop.getCanvasRect");

    public ValueTask Reload() =>
        _jsRuntime.InvokeVoidAsync("interop.reload");

    public ValueTask AddEventListeners() =>
        _jsRuntime.InvokeVoidAsync("interop.addEventListeners");

    //public ValueTask UpdateIndexedDb(string name, byte[] data) =>
    //    _jsRuntime.InvokeVoidAsync("interop.fileStore.updateIndexedDb", name, new ByteArray(data));

    //public ValueTask<int> DownloadAndUpdateIndexedDb(string url, string name, int[] sizes) =>
    //    _jsRuntime.InvokeAsync<int>("interop.downloadAndUpdateIndexedDb", url, name, sizes);

    //public ValueTask<ByteArray> ReadIndexedDbAsByteArray(string name) =>
    //    _jsRuntime.InvokeAsync<ByteArray>("interop.fileStore.readIndexedDb", name);

    //public ValueTask DownloadFile(string name) =>
    //    _jsRuntime.InvokeVoidAsync("interop.fileStore.downloadFile", name);

    //public ValueTask InitWebAssembly(bool isSpawn, byte[] data) =>
    //    _jsRuntime.InvokeVoidAsync("interop.webassembly.initWebAssembly", isSpawn, new ByteArray(data));

    //public ValueTask SNetInitWebsocket() =>
    //    _jsRuntime.InvokeVoidAsync("interop.webassembly.snetInitWebsocket");
}
