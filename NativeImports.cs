namespace diabloblazor;

static class NativeImports
{
    private const string main = "main.cpp";

    [DllImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static extern void DApi_Init(uint time, int offscreen, int v0, int v1, int v2, int spawn, IntPtr[] callbacks);

    [DllImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static extern void DApi_Mouse(int action, int button, int mods, int x, int y);

    [DllImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static extern void DApi_Key(int action, int mods, int key);

    [DllImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static extern void DApi_Char(int chr);

    [DllImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static extern void DApi_Render(uint time);
}
