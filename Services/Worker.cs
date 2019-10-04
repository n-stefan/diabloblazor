using diabloblazor.Enums;
using diabloblazor.Models;
using diabloblazor.Pages;
using System;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace diabloblazor.Services
{
    public class Worker
    {
        private const long _resolution = 10_000;

        private const string _spawnWasmFilename = "DiabloSpawn.wasm";
        private const string _retailWasmFilename = "Diablo.wasm";

        private const int _spawnWasmFilesize = 1_390_365;
        private const int _retailWasmFilesize = 1_528_787;

        private readonly HttpClient _httpClient;
        private readonly Interop _interop;

        public Worker(HttpClient httpClient, Interop interop)
        {
            _httpClient = httpClient;
            _interop = interop;
        }

        public async Task InitGame(Main app)
        {
            //progress("Loading...");

            int mpqLoaded = 0, /*mpqTotal = (mpq ? mpq.size : 0)*/ wasmLoaded = 0, wasmTotal = (app.GameType == GameType.Spawn ? _spawnWasmFilesize : _retailWasmFilesize);
            int wasmWeight = 5;

            //function updateProgress()
            //{
            //    progress("Loading...", mpqLoaded + wasmLoaded * wasmWeight, mpqTotal + wasmTotal * wasmWeight);
            //}

            app.OnProgress(new Progress { Message = "Starting game..." });

            var loadWasm = InitWasm(app);

            //wasmLoaded = Math.Min(e.loaded, wasmTotal);
            //updateProgress();

            //let loadMpq = mpq ? readFile(mpq, e => {
            //    mpqLoaded = e.loaded;
            //    updateProgress();
            //}) : Promise.resolve(null);

            //[wasm, mpq] = await Promise.all([loadWasm, loadMpq]);
            /*var wasm =*/ await loadWasm;

            //if (mpq) {
            //  files.set(spawn? 'spawn.mpq' : 'diabdat.mpq', new Uint8Array(mpq));
            //}

            //progress("Initializing...");

            //TODO: version from app (config)
            var version = Regex.Match("1.0.0", @"(\d+)\.(\d+)\.(\d+)", RegexOptions.Compiled);

            //await _interop.SNetInitWebsocket();
            await _interop.DApiInit(DateTime.Now.Ticks / _resolution, app.Offscreen ? 1 : 0, int.Parse(version.Groups[1].Value), int.Parse(version.Groups[2].Value), int.Parse(version.Groups[3].Value));

            app.Timer = new Timer(
                async _ => await _interop.CallApi("DApi_Render", DateTime.Now.Ticks / _resolution),
            null, 0, 50);
        }

        private async Task InitWasm(Main app /*progress*/)
        {
            //TODO: URL from app (config)
            var url = $"http://localhost:53287/{ (app.GameType == GameType.Spawn ? _spawnWasmFilename : _retailWasmFilename) }";
            
            var binary = await _httpClient.GetByteArrayAsync(url);
            //onDownloadProgress: progress

            /*var result =*/ await _interop.InitWebAssembly(app.GameType == GameType.Spawn, binary);
            //progress({ loaded: 2000000 });
           
            //return result;
        }
    }
}
