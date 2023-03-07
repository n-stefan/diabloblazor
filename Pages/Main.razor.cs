
//TODO master list:
//Move as much as possible from TS to C#
//Use threads (Worker) when available
//Compress .mpq?
//Multiplayer?
//Touch? Low priority

namespace diabloblazor.Pages;

public partial class Main : ComponentBase
{
    //TODO: Move some into AppState
    private static readonly int[] spawnFilesizes = { 50_274_091, 25_830_791 };
    private readonly int bufferSize = 524_288;
    private const string spawnFilename = "spawn.mpq";
    private const string retailFilename = "diabdat.mpq";
    private static string? saveName;
    private bool isDrop;
    private bool preventDefaultKeyDown;
    private bool preventDefaultDragOver;
    private ClientRect canvasRect;
    private ElementReference downloadLink;
    private IBrowserFile? file;
    private static IFileSystem fileSystem;
    private static IGraphics graphics;

    public bool Offscreen { get; private set; }
    public int RenderInterval { get; private set; }
    public Config Config { get; private set; }
    public static GameType GameType { get; private set; }
    public static Timer? Timer { private get; set; }

    private string FPSTarget =>
        (RenderInterval != 0) ? (1000d / RenderInterval).ToString("N2") : "0";

    [Inject]
    private IAppState AppState { get; set; } = default!;
    [Inject]
    private IInterop Interop { get; set; } = default!;
    [Inject]
    private IExceptionHandler ExceptionHandler { get; set; } = default!;
    [Inject]
    private IConfiguration Configuration { get; set; } = default!;
    [Inject]
    private IFileSystem FileSystem { get; set; } = default!;
    [Inject]
    private IGraphics Graphics { get; set; } = default!;
    [Inject]
    private IWorker Worker { get; set; } = default!;
    [Inject]
    private NavigationManager NavigationManager { get; set; } = default!;
    [Inject]
    private HttpClient HttpClient { get; set; } = default!;

    private (double x, double y) MousePos(MouseEventArgs e)
    {
        double tx = 0, ty = 0;
        tx = Math.Max(canvasRect.Left, Math.Min(canvasRect.Right, tx + e.ClientX));
        ty = Math.Max(canvasRect.Top, Math.Min(canvasRect.Bottom, ty + e.ClientY));
        return (
            x: Math.Max(0, Math.Min(Math.Round((tx - canvasRect.Left) / (canvasRect.Right - canvasRect.Left) * 640), 639)),
            y: Math.Max(0, Math.Min(Math.Round((ty - canvasRect.Top) / (canvasRect.Bottom - canvasRect.Top) * 480), 479))
        );
    }

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
            string s when s.StartsWith("F") => int.Parse(s[1..]) + 111,
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

    protected override async Task OnInitializedAsync()
    {
        fileSystem = FileSystem;
        graphics = Graphics;

        await Interop.SetDotNetReference(DotNetObjectReference.Create(this));

        Config = new Config { Version = Configuration["Version"] };

        RenderInterval = JSImports.GetRenderInterval();

        await JSImports.InitIndexedDb();

        if (FileSystem.HasFile(spawnFilename, spawnFilesizes))
        {
            AppState.HasSpawn = true;
        }

        InitSaves();

        canvasRect = await Interop.GetCanvasRect();

        ExceptionHandler.Exception += (_, e) => JSImports.Alert($"An error has occurred: {e.Message}");

        JSImports.AddEventListeners();
    }

    private void OnRenderIntervalChange(ChangeEventArgs e) =>
        JSImports.SetRenderInterval(RenderInterval);

    private void OnCanvasMouseMove(MouseEventArgs e)
    {
        var (x, y) = MousePos(e);
        NativeImports.DApi_Mouse(0, 0, EventModifiers(e), Convert.ToInt32(x), Convert.ToInt32(y));
    }

    private void OnCanvasMouseDown(MouseEventArgs e)
    {
        var (x, y) = MousePos(e);
        NativeImports.DApi_Mouse(1, MouseButton(e), EventModifiers(e), Convert.ToInt32(x), Convert.ToInt32(y));
    }

    private void OnCanvasMouseUp(MouseEventArgs e)
    {
        var (x, y) = MousePos(e);
        NativeImports.DApi_Mouse(2, MouseButton(e), EventModifiers(e), Convert.ToInt32(x), Convert.ToInt32(y));
    }

    private void OnCanvasKeyDown(KeyboardEventArgs e)
    {
        var keyCode = GetKeyCode(e);

        if (keyCode == -1)
        {
            return;
        }
        if (keyCode is 8 or 9 or (>= 112 and <= 119))
        {
            preventDefaultKeyDown = true;
        }

        NativeImports.DApi_Key(0, EventModifiers(e), keyCode);

        if (keyCode >= 32 && e.Key.Length == 1)
        {
            NativeImports.DApi_Char(e.Key[0]);
        }
        else if (/*keyCode == 8 ||*/ keyCode == 13)
        {
            NativeImports.DApi_Char(keyCode);
        }
    }

    private static void OnCanvasKeyUp(KeyboardEventArgs e) =>
        NativeImports.DApi_Key(1, EventModifiers(e), GetKeyCode(e));

    private static void OnCanvasContextMenu(MouseEventArgs _)
    {
        //Do nothing
    }

    private void OnMainDragEnter(DragEventArgs e) =>
        SetDropping(1);

    private void OnMainDragLeave(DragEventArgs e) =>
        SetDropping(-1);

    private void OnMainDragOver(DragEventArgs e)
    {
        if (e.DataTransfer.Items.Any(x => x.Kind == "file") || e.DataTransfer.Files.Any())
        {
            preventDefaultDragOver = true;
        }
    }

    private void SetDropping(int change) =>
        AppState.Dropping = Math.Max(AppState.Dropping + change, 0);

    private void InitSaves()
    {
        var filenames = FileSystem.GetFilenames();
        var saveNames = filenames.Where(x => x.EndsWith(".sv")).ToList();
        saveNames.ForEach(x => AppState.Saves.Add(new SaveGame(x)));
    }

    private async Task<byte[]> ReadInputFile(string message)
    {
        var bytesRead = 0;
        var totalBytesRead = 0;
        var data = new byte[file.Size];

        using var stream = file.OpenReadStream(520_000_000);

        do
        {
            var count = Math.Min(file.Size - totalBytesRead, bufferSize);
            bytesRead = await stream.ReadAsync(data, totalBytesRead, (int)count);
            totalBytesRead += bytesRead;
            OnProgress(new Progress { Message = message, BytesLoaded = totalBytesRead, Total = file.Size });
        }
        while (bytesRead != 0);

        return data;
    }

    private async Task LoadMpqFile(InputFileChangeEventArgs e)
    {
        file = e.File;
        await Start(file.Name);
    }

    private async Task UploadSaveFile(InputFileChangeEventArgs e)
    {
        file = e.File;
        await Upload(file.Name);
    }

    private async Task Upload(string name)
    {
        if (name is null)
        {
            throw new ArgumentNullException(nameof(name));
        }

        if (!name.EndsWith(".sv"))
        {
            JSImports.Alert("Please select an SV file.");
            return;
        }

        if (await JSImports.IndexedDbHasFile(name))
        {
            JSImports.Alert($"Save '{name}' already exists.");
            return;
        }

        var data = await ReadInputFile("Uploading...");
        FileSystem.SetFile(name, data);
        JSImports.StoreIndexedDb(name, data);

        file = null;

        AppState.Saves.Add(new SaveGame(name));
    }

    private void GoBack() =>
        AppState.ShowSaves = false;

    private async Task DownloadSave(string name)
    {
        var data = await Interop.ReadIndexedDb(name);
        var base64 = Convert.ToBase64String(data);
        await Interop.ClickDownloadLink(downloadLink, name, $"data:application/octet-stream;base64,{base64}");
    }

    private void RemoveSave(SaveGame saveGame)
    {
        if (!JSImports.Confirm($"Are you sure you want to delete {saveGame.ShortName}?"))
        {
            return;
        }

        FileSystem.RemoveFile(saveGame.Name);
        var saveToRemove = AppState.Saves.FirstOrDefault(x => x.Name == saveGame.Name);
        AppState.Saves.Remove(saveToRemove);
    }

    private void ShowSaves() =>
        AppState.ShowSaves = !AppState.ShowSaves;

    private async Task LoadGame()
    {
        JSImports.InitGraphics(Offscreen);
        JSImports.InitSound();
        await DoLoadGame();
    }

    private async Task DoLoadGame()
    {
        if (GameType == GameType.Retail)
        {
            await LoadRetail();
            Worker.InitGame(this);
        }
        else
        {
            if (AppState.HasSpawn)
            {
                Worker.InitGame(this);
            }
            else
            {
                await LoadSpawn();
            }
        }
    }

    private async Task LoadRetail()
    {
        if (!FileSystem.HasFile(retailFilename))
        {
            if (isDrop)
            {
                await JSImports.SetDropFile();
            }
            else
            {
                var data = await ReadInputFile("Loading...");
                FileSystem.SetFile(file.Name, data);

                file = null;
            }
        }
    }

    private async Task LoadSpawn()
    {
        var filesize = FileSystem.GetFilesize(spawnFilename);
        if (filesize != 0 && !spawnFilesizes.Contains(filesize))
        {
            FileSystem.RemoveFile(spawnFilename);
            filesize = 0;
        }
        if (filesize == 0)
        {
            var url = $"{NavigationManager.BaseUri}{spawnFilename}";
            var binary = await HttpClient.GetWithProgressAsync(new Uri(url), "Downloading...", spawnFilesizes[1], bufferSize, OnProgress);
            FileSystem.SetFile(spawnFilename, binary);
            JSImports.StoreIndexedDb(spawnFilename, binary);
            Worker.InitGame(this);
        }
    }

    [JSInvokable]
    public async Task Start(string? name = null, bool isDrop = false)
    {
        //if (this.compressMpq)
        //    this.compressMpq.start(file);

        if (name is not null && !name.EndsWith(".mpq"))
        {
            JSImports.Alert("Please select an MPQ file. If you downloaded the installer from GoG, you will need to install it on PC and use the MPQ file from the installation folder.");
            AppState.Dropping = 0;
            StateHasChanged();
            return;
        }

        GameType = (name == retailFilename) ? GameType.Retail : GameType.Shareware;

        this.isDrop = isDrop;
        AppState.Dropping = 0;
        AppState.Loading = true;

        await LoadGame();

        //document.addEventListener('touchstart', this.onTouchStart, { passive: false, capture: true});
        //document.addEventListener('touchmove', this.onTouchMove, { passive: false, capture: true});
        //document.addEventListener('touchend', this.onTouchEnd, { passive: false, capture: true});

        this.isDrop = false;
        AppState.Started = true;

        StateHasChanged();
    }

    [JSInvokable]
    public void OnResize(ClientRect rect) =>
        canvasRect = rect;

    [JSInvokable]
    public void OnProgress(Progress progress)
    {
        AppState.Progress = progress;
        StateHasChanged();
    }

    [JSInvokable]
    public ulong SetFile(string name, byte[] data) =>
        (ulong)FileSystem.SetFile(name, data);

    [UnmanagedCallersOnly]
    public static void CurrentSaveId(int id) =>
        saveName = (id >= 0) ? (GameType == GameType.Shareware) ? $"spawn{id}.sv" : $"single_{id}.sv" : null;

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
    public static void ExitError(nint messageAddress)
    {
        var message = Utils.GetString(messageAddress);
        JSImports.Alert($"An error has occurred: {message}");
    }

    [UnmanagedCallersOnly]
    public static void SetCursor(int x, int y) =>
        NativeImports.DApi_Mouse(0, 0, 0, x, y);

    [UnmanagedCallersOnly]
    public static int GetFilesize(nint nameAddress) =>
        fileSystem.GetFilesize(nameAddress);

    [UnmanagedCallersOnly]
    public static nint GetFileContents(nint nameAddress) =>
        fileSystem.GetFileContents(nameAddress);

    [UnmanagedCallersOnly]
    public static void PutFileContents(nint nameAddress, nint dataAddress, int dataLength) =>
        fileSystem.PutFileContents(nameAddress, dataAddress, dataLength);

    [UnmanagedCallersOnly]
    public static void RemoveFile(nint nameAddress) =>
        fileSystem.RemoveFile(nameAddress);

    [UnmanagedCallersOnly]
    public static void DrawBegin() =>
        graphics.DrawBegin();

    [UnmanagedCallersOnly]
    public static void DrawEnd() =>
        graphics.DrawEnd();

    [UnmanagedCallersOnly]
    public static void DrawBlit(int x, int y, int w, int h, nint dataAddress) =>
        graphics.DrawBlit(x, y, w, h, dataAddress);

    [UnmanagedCallersOnly]
    public static void DrawClipText(int x0, int y0, int x1, int y1) =>
        graphics.DrawClipText(x0, y0, x1, y1);

    [UnmanagedCallersOnly]
    public static void DrawText(int x, int y, nint textAddress, int color) =>
        graphics.DrawText(x, y, textAddress, color);

    //private void CompressMPQ() =>
    //    AppState.Compress = true;
}
