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

    public ValueTask SetDotNetReference(DotNetObjectReference<Main> reference) =>
        _jsRuntime.InvokeVoidAsync("interop.setDotNetReference", reference);

    public ValueTask<byte[]> ReadIndexedDb(string name) =>
        _jsRuntime.InvokeAsync<byte[]>("interop.fileStore.readIndexedDb", name);

    public ValueTask ClickDownloadLink(ElementReference link, string download, string href) =>
        _jsRuntime.InvokeVoidAsync("interop.clickDownloadLink", link, download, href);

    public void Render(RenderBatch renderBatch) =>
        _jsInProcessRuntime.InvokeVoid("interop.graphics.onRender", renderBatch);

    public ValueTask<ClientRect> GetCanvasRect() =>
        _jsRuntime.InvokeAsync<ClientRect>("interop.getCanvasRect");
}
