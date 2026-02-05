//TODO master list:
//Move as much as possible from TS to C#
//Use threads (Worker) when available
//Compress .mpq?
//Multiplayer?
//Touch? Low priority

namespace diabloblazor.Pages;

public partial class Main : ComponentBase
{
    private bool preventDefaultKeyDown;
    private bool preventDefaultDragOver;
    private DOMRect canvasRect;
    private ElementReference downloadLink;
    private IBrowserFile? file;
    private readonly IAppState appState;
    private readonly IInterop interop;
    private readonly IExceptionHandler exceptionHandler;
    private readonly IConfiguration configuration;
    private readonly IWorker worker;
    private readonly NavigationManager navigationManager;
    private readonly HttpClient httpClient;

    private string FPSTarget =>
        (RenderInterval != 0) ? (1000d / RenderInterval).ToString("N2") : "0";

    public bool Offscreen { get; }

    public int RenderInterval { get; private set; }

    public Config Config { get; private set; }

    public Main(IAppState appState, IInterop interop, IExceptionHandler exceptionHandler, IConfiguration configuration,
        IWorker worker, NavigationManager navigationManager, HttpClient httpClient, IFileSystem fileSystem, IGraphics graphics)
    {
        this.appState = appState;
        this.interop = interop;
        this.exceptionHandler = exceptionHandler;
        this.configuration = configuration;
        this.worker = worker;
        this.navigationManager = navigationManager;
        this.httpClient = httpClient;
        Main.fileSystem = fileSystem;
        Main.graphics = graphics;
    }

    protected override async Task OnInitializedAsync()
    {
        await interop.SetDotNetReference(DotNetObjectReference.Create(this));

        Config = new Config { Version = configuration["Version"] };

        RenderInterval = JSImports.GetRenderInterval();

        await JSImports.InitIndexedDb();

        if (fileSystem.HasFile(spawnFilename, spawnFilesizes))
        {
            appState.HasSpawn = true;
        }

        InitSaves();

        canvasRect = await interop.GetCanvasRect();

        exceptionHandler.Exception += static (_, e) => JSImports.Alert($"An error has occurred: {e.Message}");

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
        else if (keyCode is 8 or 9 or (>= 112 and <= 119))
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

    private void OnMainDragOver(DragEventArgs e)
    {
        if (e.DataTransfer.Items.Any(static x => string.Equals(x.Kind, "file", StringComparison.Ordinal)) || e.DataTransfer.Files.Length != 0)
        {
            preventDefaultDragOver = true;
        }
    }

    private void OnMainDragEnter(DragEventArgs _) =>
        SetDropping(1);

    private void OnMainDragLeave(DragEventArgs _) =>
        SetDropping(-1);

    private async Task LoadMpq(InputFileChangeEventArgs e)
    {
        file = e.File;
        await Start(file.Name);
    }

    private async Task UploadSave(InputFileChangeEventArgs e)
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

        if (await JSImports.HasFileIndexedDb(name))
        {
            JSImports.Alert($"Save '{name}' already exists.");
            return;
        }

        var data = await ReadInputFile("Uploading...");
        fileSystem.SetFile(name, data);
        await JSImports.StoreIndexedDb(name, data);

        file = null;

        appState.Saves.Add(new SaveGame(name));
    }

    private async Task DownloadSave(string name)
    {
        var data = await interop.ReadIndexedDb(name);
        var base64 = Convert.ToBase64String(data);
        await interop.ClickDownloadLink(downloadLink, name, $"data:application/octet-stream;base64,{base64}");
    }

    private async Task RemoveSave(SaveGame saveGame)
    {
        if (!JSImports.Confirm($"Are you sure you want to delete {saveGame.ShortName}?"))
        {
            return;
        }

        fileSystem.RemoveFile(saveGame.Name);
        await JSImports.RemoveIndexedDb(saveGame.Name);
        var saveToRemove = appState.Saves.FirstOrDefault(x => string.Equals(x.Name, saveGame.Name, StringComparison.Ordinal));
        appState.Saves.Remove(saveToRemove);
    }

    private void InitSaves()
    {
        var fileNames = fileSystem.GetFilenames();
        var saveNames = fileNames.Where(static x => x.EndsWith(".sv")).ToList();
        saveNames.ForEach(x => appState.Saves.Add(new SaveGame(x)));
    }

    private void ShowSaves() =>
        appState.ShowSaves = true;

    private void GoBack() =>
        appState.ShowSaves = false;

    private async Task LoadGame()
    {
        JSImports.InitGraphics(Offscreen);
        JSImports.InitSound();
        if (GameType == GameType.Retail && !fileSystem.HasFile(retailFilename))
        {
            await LoadRetail();
        }
        else if (GameType == GameType.Shareware && !appState.HasSpawn)
        {
            await LoadSpawn();
        }
        worker.RunGame(this);
    }

    private async Task LoadRetail()
    {
        if (appState.Dropping != 0)
        {
            appState.Dropping = 0;
            await JSImports.SetDropFile();
        }
        else
        {
            var data = await ReadInputFile("Loading...");
            fileSystem.SetFile(file.Name, data);

            file = null;
        }
    }

    private async Task LoadSpawn()
    {
        var filesize = fileSystem.GetFilesize(spawnFilename);
        if (filesize != 0 && !spawnFilesizes.Contains(filesize))
        {
            fileSystem.RemoveFile(spawnFilename);
            await JSImports.RemoveIndexedDb(spawnFilename);
            filesize = 0;
        }
        if (filesize == 0)
        {
            var url = $"{navigationManager.BaseUri}{spawnFilename}";
            var binary = await httpClient.GetWithProgressAsync(new Uri(url), "Downloading...", spawnFilesizes[1], bufferSize, OnProgress);
            fileSystem.SetFile(spawnFilename, binary);
            await JSImports.StoreIndexedDb(spawnFilename, binary);
        }
    }

    [JSInvokable]
    public async Task Start(string? name = null)
    {
        //if (this.compressMpq)
        //    this.compressMpq.start(file);

        if (name is not null && !name.EndsWith(".mpq"))
        {
            JSImports.Alert("Please select an MPQ file. If you downloaded the installer from GoG, you will need to install it on PC and use the MPQ file from the installation folder.");
            appState.Dropping = 0;
            StateHasChanged();
            return;
        }

        GameType = string.Equals(name, retailFilename, StringComparison.Ordinal) ? GameType.Retail : GameType.Shareware;

        appState.Loading = true;

        await LoadGame();

        //document.addEventListener('touchstart', this.onTouchStart, { passive: false, capture: true});
        //document.addEventListener('touchmove', this.onTouchMove, { passive: false, capture: true});
        //document.addEventListener('touchend', this.onTouchEnd, { passive: false, capture: true});

        appState.Started = true;

        StateHasChanged();
    }

    [JSInvokable]
    public void OnResize(DOMRect rect) =>
        canvasRect = rect;

    [JSInvokable]
    public void OnProgress(Progress progress)
    {
        appState.Progress = progress;
        StateHasChanged();
    }

    [JSInvokable]
    public ulong SetFile(string name, byte[] data) =>
        (ulong)fileSystem.SetFile(name, data);

    private void SetDropping(int change) =>
        appState.Dropping = Math.Max(appState.Dropping + change, 0);

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

    //private void CompressMPQ() =>
    //    AppState.Compress = true;
}
