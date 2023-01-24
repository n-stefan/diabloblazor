namespace diabloblazor.Imports;

static partial class NativeImports
{
    private const string main = "main.cpp";

    [LibraryImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static partial void DApi_Init(uint time, int offscreen, int v0, int v1, int v2, int spawn, IntPtr[] callbacks);

    [LibraryImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static partial void DApi_Mouse(int action, int button, int mods, int x, int y);

    [LibraryImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static partial void DApi_Key(int action, int mods, int key);

    [LibraryImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static partial void DApi_Char(int chr);

    [LibraryImport(main), DefaultDllImportSearchPaths(DllImportSearchPath.SafeDirectories)]
    internal static partial void DApi_Render(uint time);
}
