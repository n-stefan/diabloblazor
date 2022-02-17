namespace diabloblazor.Pages;

public partial class Main : ComponentBase
{
    //TODO: Move some into AppState
    private static readonly int[] spawnFilesizes = { 50_274_091, 25_830_791 };
    private const string spawnFilename = "spawn.mpq";
    private const string retailFilename = "diabdat.mpq";
    private string? saveName;
    private bool isDrop;
    private bool preventDefaultKeyDown;
    private bool preventDefaultDragOver;
    private ClientRect canvasRect;
    private ElementReference downloadLink;
    private static GCHandle interopHandle;
    private static GCHandle fileSystemHandle;

    public bool Offscreen { get; private set; }
    public int RenderInterval { get; private set; }
    public Config Config { get; private set; }
    public GameType GameType { get; private set; }
    public Timer? Timer { private get; set; }

    private string FPSTarget =>
        (RenderInterval != 0) ? (1000d / RenderInterval).ToString("N2") : "0";

    [Inject]
    private AppState AppState { get; set; } = default!;
    [Inject]
    private Interop Interop { get; set; } = default!;
    [Inject]
    private ExceptionHandler ExceptionHandler { get; set; } = default!;
    [Inject]
    private NavigationManager NavigationManager { get; set; } = default!;
    [Inject]
    private HttpClient HttpClient { get; set; } = default!;
    [Inject]
    private IConfiguration Configuration { get; set; } = default!;
    [Inject]
    private FileSystem FileSystem { get; set; } = default!;

    private (double x, double y) MousePos(MouseEventArgs e)
    {
        double tx = 0, ty = 0;
        tx = Max(canvasRect.Left, Min(canvasRect.Right, tx + e.ClientX));
        ty = Max(canvasRect.Top, Min(canvasRect.Bottom, ty + e.ClientY));
        return (
            x: Max(0, Min(Round((tx - canvasRect.Left) / (canvasRect.Right - canvasRect.Left) * 640), 639)),
            y: Max(0, Min(Round((ty - canvasRect.Top) / (canvasRect.Bottom - canvasRect.Top) * 480), 479))
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
        throw new ArgumentException($"Parameter '{nameof(e)}' must be of type MouseEventArgs or KeyboardEventArgs!");
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
        interopHandle = GCHandle.Alloc(Interop);
        fileSystemHandle = GCHandle.Alloc(FileSystem);

        await Interop.SetDotNetReference(DotNetObjectReference.Create(this));

        Config = new Config { Version = Configuration["Version"] };

        RenderInterval = await Interop.GetRenderInterval();

        await Interop.InitIndexedDb();

        if (FileSystem.HasFile(spawnFilename, spawnFilesizes))
        {
            AppState.HasSpawn = true;
        }

        InitSaves();

        canvasRect = await Interop.GetCanvasRect();

        ExceptionHandler.Exception += (_, e) => Interop.Alert($"An error has occured: {e.Message}");

        await Interop.AddEventListeners();
    }

    private async Task OnRenderIntervalChange(ChangeEventArgs e) =>
        await Interop.SetRenderInterval(RenderInterval);

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
        AppState.Dropping = Max(AppState.Dropping + change, 0);

    private void InitSaves()
    {
        var filenames = FileSystem.GetFilenames();
        var saveNames = filenames.Where(x => x.EndsWith(".sv")).ToList();
        saveNames.ForEach(x => AppState.Saves.Add(new SaveGame(x)));
    }

    private static string ExtractFilename(string? path)
    {
        if (path is null)
        {
            throw new ArgumentNullException(nameof(path));
        }

        //Path.GetFileName doesn't seem to do the trick
        var index = path.LastIndexOf(@"\");
        return (index != -1) ? path[(index + 1)..] : path;
    }

    private async Task ParseSaveFile(ChangeEventArgs e)
    {
        var value = e.Value?.ToString();
        var name = ExtractFilename(value).ToLower();
        await Upload(name);
    }

    private async Task Upload(string name)
    {
        if (name is null)
        {
            throw new ArgumentNullException(nameof(name));
        }

        if (!name.EndsWith(".sv"))
        {
            Interop.Alert("Please select an SV file.");
            return;
        }

        if (await Interop.IndexedDbHasFile(name))
        {
            Interop.Alert($"Save '{name}' already exists.");
            return;
        }

        await Interop.UploadFile();
        AppState.Saves.Add(new SaveGame(name));
    }

    private async Task ParseMpqFile(ChangeEventArgs e)
    {
        var value = e.Value?.ToString();
        var name = ExtractFilename(value).ToLower();
        await Start(name);
    }

    private void GoBack() =>
        AppState.ShowSaves = false;

    private async Task DownloadSave(string name)
    {
        var data = await Interop.ReadIndexedDb(name);
        var base64 = Convert.ToBase64String(data);
        await Interop.ClickDownloadLink(downloadLink, name, $"data:application/octet-stream;base64,{base64}");
    }

    private async Task RemoveSave(SaveGame saveGame)
    {
        if (!Interop.Confirm($"Are you sure you want to delete {saveGame.ShortName}?"))
        {
            return;
        }

        await RemoveFile(saveGame.Name);
        var saveToRemove = AppState.Saves.FirstOrDefault(x => x.Name == saveGame.Name);
        AppState.Saves.Remove(saveToRemove);
    }

    private void ShowSaves() =>
        AppState.ShowSaves = !AppState.ShowSaves;

    private async Task LoadGame()
    {
        await Interop.InitGraphics(Offscreen);
        await Interop.InitSound();
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
                await Interop.SetDropFile();
            }
            else
            {
                await Interop.SetInputFile();
            }
        }
    }

    private async Task LoadSpawn()
    {
        var filesize = FileSystem.GetFilesize(spawnFilename);
        if (filesize != 0 && !spawnFilesizes.Contains(filesize))
        {
            await RemoveFile(spawnFilename);
            filesize = 0;
        }
        if (filesize == 0)
        {
            var url = $"{NavigationManager.BaseUri}{spawnFilename}";
            var binary = await HttpClient.GetWithProgressAsync(new Uri(url), "Downloading...", spawnFilesizes[1], 524_288, OnProgress);
            var address = FileSystem.SetFile(spawnFilename, binary);
            Interop.StoreIndexedDb(Marshal.StringToHGlobalAuto(spawnFilename), address, binary.Length);
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
            Interop.Alert("Please select an MPQ file. If you downloaded the installer from GoG, you will need to install it on PC and use the MPQ file from the installation folder.");
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
    public void SetSaveName(int id) =>
        saveName = (id >= 0) ? (GameType == GameType.Shareware) ? $"spawn{id}.sv" : $"single_{id}.sv" : null;

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
    public async Task OnExit()
    {
        if (AppState.Error)
        {
            return;
        }

        Timer?.Change(Timeout.Infinite, Timeout.Infinite);
        if (Timer != null)
        {
            await Timer.DisposeAsync();
        }
        Timer = null;

        FileSystem.Free();

        interopHandle.Free();
        fileSystemHandle.Free();

        await Interop.Reload();
    }

    [JSInvokable]
    public static void SetCursorPos(double x, double y) =>
        NativeImports.DApi_Mouse(0, 0, 0, Convert.ToInt32(x), Convert.ToInt32(y));

    //TODO: Move to FileSystem?
    [JSInvokable]
    public ulong SetFile(string name, byte[] data) =>
        (ulong)FileSystem.SetFile(name, data);

    unsafe private static string GetFilename(IntPtr address)
    {
        var span = new ReadOnlySpan<byte>((byte*)address, 20);
        span = span[..span.IndexOf((byte)0)];
        return Encoding.UTF8.GetString(span);
    }

    [UnmanagedCallersOnly]
    public static int GetFilesize(IntPtr nameAddress)
    {
        var name = GetFilename(nameAddress);
        var fileSystem = (FileSystem)fileSystemHandle.Target;
        return fileSystem.GetFilesize(name);
    }

    [UnmanagedCallersOnly]
    public static IntPtr GetFileContents(IntPtr nameAddress)
    {
        var name = GetFilename(nameAddress);
        var fileSystem = (FileSystem)fileSystemHandle.Target;
        return fileSystem.GetFile(name);
    }

    [UnmanagedCallersOnly]
    unsafe public static void PutFileContents(IntPtr nameAddress, IntPtr dataAddress, int dataLength)
    {
        var name = GetFilename(nameAddress);
        var span = new ReadOnlySpan<byte>((byte*)dataAddress, dataLength);
        var data = span.ToArray();
        var fileSystem = (FileSystem)fileSystemHandle.Target;
        var fileAddress = fileSystem.SetFile(name, data);
        var interop = (Interop)interopHandle.Target;
        interop.StoreIndexedDb(nameAddress, fileAddress, data.Length);
    }

    [UnmanagedCallersOnly]
    public static void RemoveFile(IntPtr nameAddress)
    {
        var name = GetFilename(nameAddress);
        var fileSystem = (FileSystem)fileSystemHandle.Target;
        fileSystem.DeleteFile(name);
        var interop = (Interop)interopHandle.Target;
        interop.RemoveIndexedDb(name);
    }

    private ValueTask RemoveFile(string name)
    {
        FileSystem.DeleteFile(name);
        return Interop.RemoveIndexedDb(name);
    }

    //private void CompressMPQ() =>
    //    AppState.Compress = true;
}
