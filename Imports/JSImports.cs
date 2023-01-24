namespace diabloblazor.Imports;

static partial class JSImports
{
    [JSImport("globalThis.interop.fileStore.storeIndexedDb")]
    internal static partial void StoreIndexedDb([JSMarshalAs<JSType.String>] string name, [JSMarshalAs<JSType.MemoryView>] ArraySegment<byte> data);
}
