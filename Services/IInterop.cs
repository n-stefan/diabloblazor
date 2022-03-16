namespace diabloblazor.Services;

public interface IInterop
{
    ValueTask AddEventListeners();

    void Alert(string message);

    ValueTask ClickDownloadLink(ElementReference link, string download, string href);

    bool Confirm(string message);

    ValueTask<ClientRect> GetCanvasRect();

    ValueTask<int> GetRenderInterval();

    ValueTask<bool> IndexedDbHasFile(string name);

    ValueTask InitGraphics(bool offscreen);

    ValueTask InitIndexedDb();

    ValueTask InitSound();

    ValueTask<byte[]> ReadIndexedDb(string name);

    void Reload();

    void RemoveIndexedDb(string name);

    void Render(RenderBatch renderBatch);

    ValueTask SetDotNetReference(DotNetObjectReference<Main> reference);

    ValueTask SetDropFile();

    ValueTask SetRenderInterval(int renderInterval);

    void StoreIndexedDb(IntPtr nameAddress, IntPtr dataAddress, int dataLength);
}
