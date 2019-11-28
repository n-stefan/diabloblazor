using diabloblazor.Enums;
using diabloblazor.Models;
using diabloblazor.Pages;
using Microsoft.AspNetCore.Components;
using System;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace diabloblazor.Services
{
    public class Worker
    {
        private DateTime _startTime;
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
            app.OnProgress(new Progress { Message = "Launching..." });

            var url = $"{_navigationManager.BaseUri}{(app.GameType == GameType.Shareware ? _spawnWasmFilename : _retailWasmFilename)}";
            var binary = await _httpClient.GetByteArrayAsync(url);

            app.GameWasmHandle = _interop.InitWebAssemblyUnmarshalledBegin(app.GameType == GameType.Shareware, binary);

            //await _interop.InitWebAssembly(app.GameType == GameType.Shareware, binary);
            //await RunGame(app);
        }

        private async Task RunGame(Main app)
        {
            //await _interop.SNetInitWebsocket();

            _startTime = DateTime.Now;

            var version = Regex.Match(app.Configuration.Version, @"(\d+)\.(\d+)\.(\d+)", RegexOptions.Compiled);
            await _interop.DApiInit((DateTime.Now - _startTime).TotalMilliseconds, app.Offscreen ? 1 : 0,
                int.Parse(version.Groups[1].Value), int.Parse(version.Groups[2].Value), int.Parse(version.Groups[3].Value));

            app.Timer = new Timer(
                async _ => await _interop.CallApi("DApi_Render", (DateTime.Now - _startTime).TotalMilliseconds),
            null, 0, 50);
        }

        public Task InitWebAssemblyUnmarshalledEnd(Main app) =>
            RunGame(app);
    }
}
