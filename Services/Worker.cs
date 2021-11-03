namespace diabloblazor.Services;

public class Worker
{
    private const string _spawnWasmFilename = "DiabloSpawn.wasm";
    private const string _retailWasmFilename = "Diablo.wasm";
    private readonly NavigationManager _navigationManager;
    private readonly HttpClient _httpClient;
    private readonly Interop _interop;

    public Worker(NavigationManager navigationManager, HttpClient httpClient, Interop interop)
    {
        _navigationManager = navigationManager;
        _httpClient = httpClient;
        _interop = interop;
    }

    public async Task InitGame(Main app)
    {
        if (app is null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        app.OnProgress(new Progress { Message = "Launching..." });

        var isShareware = app.GameType == GameType.Shareware;
        var url = $"{_navigationManager.BaseUri}{(isShareware ? _spawnWasmFilename : _retailWasmFilename)}";

        var binary = await _httpClient.GetByteArrayAsync(new Uri(url));

        app.GameWasmHandle = _interop.InitWebAssemblyUnmarshalledBegin(isShareware, binary);

        //await _interop.InitWebAssembly(isShareware, binary);
        //await RunGame(app);
    }

    public async Task RunGame(Main app)
    {
        if (app is null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        //await _interop.SNetInitWebsocket();

        var startTime = DateTime.Now;

        var version = Regex.Match(app.Configuration.Version, @"(\d+)\.(\d+)\.(\d+)", RegexOptions.Compiled);

        await _interop.DApiInit((DateTime.Now - startTime).TotalMilliseconds, app.Offscreen ? 1 : 0,
            int.Parse(version.Groups[1].Value), int.Parse(version.Groups[2].Value), int.Parse(version.Groups[3].Value));

        app.Timer = new Timer(
            async _ => await _interop.CallApi("DApi_Render", (DateTime.Now - startTime).TotalMilliseconds),
        null, 0, app.RenderInterval);
    }
}
