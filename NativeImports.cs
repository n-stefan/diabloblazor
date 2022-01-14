namespace diabloblazor;

static class NativeImports
{
    private const string main = "main.cpp";

    [DllImport(main)]
    internal static extern void DApi_Init(uint time, int offscreen, int v0, int v1, int v2, int spawn);

    [DllImport(main)]
    internal static extern void DApi_Mouse(int action, int button, int mods, int x, int y);

    [DllImport(main)]
    internal static extern void DApi_Key(int action, int mods, int key);

    [DllImport(main)]
    internal static extern void DApi_Char(int chr);

    [DllImport(main)]
    internal static extern void DApi_Render(uint time);

    //[DllImport(main)]
    //internal static extern IntPtr DApi_SyncTextPtr();

    //[DllImport(main)]
    //internal static extern void DApi_SyncText(int flags);
}
