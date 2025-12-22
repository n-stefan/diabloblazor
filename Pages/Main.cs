namespace diabloblazor.Pages;

public partial class Main
{
    //TODO: Move some into AppState
    private const string spawnFilename = "spawn.mpq";
    private const string retailFilename = "diabdat.mpq";
    private const int bufferSize = 524_288;

    private static readonly int[] spawnFilesizes = [ 50_274_091, 25_830_791 ];
    private static string? saveName;
    private static IFileSystem fileSystem;
    private static IGraphics graphics;

    public static GameType GameType { get; private set; }

    public static Timer? Timer { private get; set; }

    [UnmanagedCallersOnly]
    public static void CurrentSaveId(int id) =>
        saveName = (id >= 0) ? (GameType == GameType.Shareware) ? $"spawn{id}.sv" : $"single_{id}.sv" : null;

    [UnmanagedCallersOnly]
    public static void DrawBegin() =>
        graphics.DrawBegin();

    [UnmanagedCallersOnly]
    public static void DrawBlit(int x, int y, int w, int h, nint dataAddress) =>
        graphics.DrawBlit(x, y, w, h, dataAddress);

    [UnmanagedCallersOnly]
    public static void DrawClipText(int x0, int y0, int x1, int y1) =>
        graphics.DrawClipText(x0, y0, x1, y1);

    [UnmanagedCallersOnly]
    public static void DrawEnd() =>
        graphics.DrawEnd();

    [UnmanagedCallersOnly]
    public static void DrawText(int x, int y, nuint textAddress, int color) =>
        graphics.DrawText(x, y, textAddress, color);

    [UnmanagedCallersOnly]
    public static void ExitError(nuint messageAddress)
    {
        var message = Marshal.PtrToStringAuto((nint)messageAddress);
        JSImports.Alert($"An error has occurred: {message}");
    }

    [UnmanagedCallersOnly]
    public static void ExitGame()
    {
        Timer?.Change(Timeout.Infinite, Timeout.Infinite);
        Timer?.Dispose();
        Timer = null;

        fileSystem.Free();

        JSImports.Reload();
    }

    [UnmanagedCallersOnly]
    public static nint GetFileContents(nuint nameAddress) =>
        fileSystem.GetFileContents(nameAddress);

    [UnmanagedCallersOnly]
    public static int GetFilesize(nuint nameAddress) =>
        fileSystem.GetFilesize(nameAddress);

    [UnmanagedCallersOnly]
    public static void PutFileContents(nuint nameAddress, nint dataAddress, int dataLength) =>
        fileSystem.PutFileContents(nameAddress, dataAddress, dataLength);

    [UnmanagedCallersOnly]
    public static void RemoveFile(nuint nameAddress) =>
        fileSystem.RemoveFile(nameAddress);

    [UnmanagedCallersOnly]
    public static void SetCursor(int x, int y) =>
        NativeImports.DApi_Mouse(0, 0, 0, x, y);

    private static int EventModifiers(EventArgs e)
    {
        //A common base class with at least ShiftKey, CtrlKey and AltKey would be nice
        if (e is MouseEventArgs me)
        {
            return (/*(*/me.ShiftKey /*|| this.touchMods[TOUCH_SHIFT])*/ ? 1 : 0) + (me.CtrlKey ? 2 : 0) + (me.AltKey ? 4 : 0) /*+ (e.touches ? 8 : 0)*/;
        }
        if (e is KeyboardEventArgs ke)
        {
            return (/*(*/ke.ShiftKey /*|| this.touchMods[TOUCH_SHIFT])*/ ? 1 : 0) + (ke.CtrlKey ? 2 : 0) + (ke.AltKey ? 4 : 0) /*+ (e.touches ? 8 : 0)*/;
        }
        throw new ArgumentException($"Parameter '{nameof(e)}' must be of type MouseEventArgs or KeyboardEventArgs.");
    }

    private static int GetKeyCode(KeyboardEventArgs e) =>
        e.Code switch
        {
            string s when s.StartsWith('F') => int.Parse(s[1..]) + 111,
            string s when s.StartsWith("Key") => s[^1] - 32,
            string s when s.StartsWith("Digit") => s[^1] + 48,
            string s when s.StartsWith("Shift") => 16,
            "Backspace" => 8,
            "Tab" => 9,
            "Enter" => 13,
            "Escape" => 27,
            "Space" => 32,
            "ArrowLeft" => 37,
            "ArrowUp" => 38,
            "ArrowRight" => 39,
            "ArrowDown" => 40,
            "Equal" => 187,
            "Minus" => 189,
            _ => -1
        };

    private static int MouseButton(MouseEventArgs e) =>
        e.Button switch
        {
            0 => 1,
            1 => 4,
            2 => 2,
            3 => 5,
            4 => 6,
            _ => 1
        };

    private static void OnCanvasContextMenu(MouseEventArgs _)
    {
        //Do nothing
    }

    private static void OnCanvasKeyUp(KeyboardEventArgs e) =>
        NativeImports.DApi_Key(1, EventModifiers(e), GetKeyCode(e));
}
