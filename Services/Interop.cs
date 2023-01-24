namespace diabloblazor.Services;

public class Interop : IInterop
{
    private readonly IJSRuntime _jsRuntime;
    private readonly IJSInProcessRuntime _jsInProcessRuntime;

    public Interop(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
        _jsInProcessRuntime = (jsRuntime as IJSInProcessRuntime)!;
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

    public void RemoveIndexedDb(string name) =>
        _jsInProcessRuntime.InvokeVoid("interop.fileStore.removeIndexedDb", name);

    public ValueTask ClickDownloadLink(ElementReference link, string download, string href) =>
        _jsRuntime.InvokeVoidAsync("interop.clickDownloadLink", link, download, href);

    public ValueTask SetDropFile() =>
        _jsRuntime.InvokeVoidAsync("interop.fileStore.setDropFile");

    public ValueTask<int> GetRenderInterval() =>
        _jsRuntime.InvokeAsync<int>("interop.fileStore.getRenderInterval");

    public ValueTask SetRenderInterval(int renderInterval) =>
        _jsRuntime.InvokeVoidAsync("interop.fileStore.setRenderInterval", renderInterval);

    public ValueTask InitGraphics(bool offscreen) =>
        _jsRuntime.InvokeVoidAsync("interop.graphics.initGraphics", offscreen);

    public void Render(RenderBatch renderBatch) =>
        _jsInProcessRuntime.InvokeVoid("interop.graphics.onRender", renderBatch);

    public ValueTask InitSound() =>
        _jsRuntime.InvokeVoidAsync("interop.sound.initSound");

    public ValueTask<ClientRect> GetCanvasRect() =>
        _jsRuntime.InvokeAsync<ClientRect>("interop.getCanvasRect");

    public void Reload() =>
        _jsInProcessRuntime.InvokeVoid("interop.reload");

    public ValueTask AddEventListeners() =>
        _jsRuntime.InvokeVoidAsync("interop.addEventListeners");
}
