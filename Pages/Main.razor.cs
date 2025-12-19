//TODO master list:
//Move as much as possible from TS to C#
//Use threads (Worker) when available
//Compress .mpq?
//Multiplayer?
//Touch? Low priority

namespace diabloblazor.Pages;

public partial class Main : ComponentBase
{
    private bool isDrop;
    private bool preventDefaultKeyDown;
    private bool preventDefaultDragOver;
    private DOMRect canvasRect;
    private ElementReference downloadLink;
    private IBrowserFile? file;

    public bool Offscreen { get; private set; }
    public int RenderInterval { get; private set; }
    public Config Config { get; private set; }

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

        ExceptionHandler.Exception += static (_, e) => JSImports.Alert($"An error has occurred: {e.Message}");

        JSImports.AddEventListeners();
    }

    private void OnRenderIntervalChange(ChangeEventArgs _) =>
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

    private void OnMainDragEnter(DragEventArgs _) =>
        SetDropping(1);

    private void OnMainDragLeave(DragEventArgs _) =>
        SetDropping(-1);

    private void OnMainDragOver(DragEventArgs e)
    {
        if (e.DataTransfer.Items.Any(static x => string.Equals(x.Kind, "file", StringComparison.Ordinal)) || e.DataTransfer.Files.Length != 0)
        {
            preventDefaultDragOver = true;
        }
    }

    private void SetDropping(int change) =>
        AppState.Dropping = Math.Max(AppState.Dropping + change, 0);

    private void InitSaves()
    {
        var filenames = FileSystem.GetFilenames();
        var saveNames = filenames.Where(static x => x.EndsWith(".sv")).ToList();
        saveNames.ForEach(x => AppState.Saves.Add(new SaveGame(x)));
    }

    private async Task<byte[]> ReadInputFile(string message)
    {
        int bytesRead;
        var totalBytesRead = 0;
        var data = new byte[file.Size];

        await using var stream = file.OpenReadStream(520_000_000);

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
        ArgumentNullException.ThrowIfNull(name);

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
        var saveToRemove = AppState.Saves.FirstOrDefault(x => string.Equals(x.Name, saveGame.Name, StringComparison.Ordinal));
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
        if (GameType == GameType.Retail && !FileSystem.HasFile(retailFilename))
        {
            await LoadRetail();
        }
        else if (GameType == GameType.Shareware && !AppState.HasSpawn)
        {
            await LoadSpawn();
        }
        Worker.InitGame(this);
    }

    private async Task LoadRetail()
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

        GameType = (string.Equals(name, retailFilename, StringComparison.Ordinal)) ? GameType.Retail : GameType.Shareware;

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
    public void OnResize(DOMRect rect) =>
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

    //private void CompressMPQ() =>
    //    AppState.Compress = true;
}
