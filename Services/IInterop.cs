namespace diabloblazor.Services;

public interface IInterop
{
    ValueTask ClickDownloadLink(ElementReference link, string download, string href);

    ValueTask<ClientRect> GetCanvasRect();

    ValueTask<byte[]> ReadIndexedDb(string name);

    void Render(RenderBatch renderBatch);

    ValueTask SetDotNetReference(DotNetObjectReference<Main> reference);
}
