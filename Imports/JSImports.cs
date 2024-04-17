namespace diabloblazor.Imports;

internal static partial class JSImports
{
    [JSImport("globalThis.window.location.reload")]
    internal static partial void Reload();

    [JSImport("globalThis.alert")]
    internal static partial void Alert(string message);

    [JSImport("globalThis.confirm")]
    internal static partial bool Confirm(string message);

    [JSImport("globalThis.interop.fileStore.storeIndexedDb")]
    internal static partial void StoreIndexedDb(string name, [JSMarshalAs<JSType.MemoryView>] ArraySegment<byte> data);

    [JSImport("globalThis.interop.fileStore.removeIndexedDb")]
    internal static partial void RemoveIndexedDb(string name);

    [JSImport("globalThis.interop.fileStore.indexedDbHasFile")]
    internal static partial Task<bool> IndexedDbHasFile(string name);

    [JSImport("globalThis.interop.fileStore.initIndexedDb")]
    internal static partial Task InitIndexedDb();

    [JSImport("globalThis.interop.fileStore.setDropFile")]
    internal static partial Task SetDropFile();

    [JSImport("globalThis.interop.fileStore.getRenderInterval")]
    internal static partial int GetRenderInterval();

    [JSImport("globalThis.interop.fileStore.setRenderInterval")]
    internal static partial void SetRenderInterval(int renderInterval);

    [JSImport("globalThis.interop.graphics.initGraphics")]
    internal static partial void InitGraphics(bool offscreen);

    [JSImport("globalThis.interop.sound.initSound")]
    internal static partial void InitSound();

    [JSImport("globalThis.interop.addEventListeners")]
    internal static partial void AddEventListeners();
}
