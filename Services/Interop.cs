namespace diabloblazor.Services;

public class Interop(IJSRuntime jsRuntime) : IInterop
{
    private readonly IJSInProcessRuntime _jsInProcessRuntime = (jsRuntime as IJSInProcessRuntime)!;

    public ValueTask SetDotNetReference(DotNetObjectReference<Main> reference) =>
        jsRuntime.InvokeVoidAsync("interop.setDotNetReference", reference);

    public ValueTask<byte[]> ReadIndexedDb(string name) =>
        jsRuntime.InvokeAsync<byte[]>("interop.fileStore.readIndexedDb", name);

    public ValueTask ClickDownloadLink(ElementReference link, string download, string href) =>
        jsRuntime.InvokeVoidAsync("interop.clickDownloadLink", link, download, href);

    public void Render(RenderBatch renderBatch) =>
        _jsInProcessRuntime.InvokeVoid("interop.graphics.render", renderBatch);

    public ValueTask<DOMRect> GetCanvasRect() =>
        jsRuntime.InvokeAsync<DOMRect>("interop.getCanvasRect");
}
