using diabloblazor.Enums;
using diabloblazor.Extensions;
using diabloblazor.Models;
using diabloblazor.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.Extensions.Configuration;
using Microsoft.JSInterop;
using System;
using System.Linq;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using static System.Math;

namespace diabloblazor.Pages
{
    public partial class Main
    {
        //TODO: Move some into AppState
        private static readonly int[] spawnFilesizes = { 50_274_091, 25_830_791 };
        private const string spawnFilename = "spawn.mpq";
        private const string retailFilename = "diabdat.mpq";
        private string? saveName;
        private bool isDrop;
        private ClientRect canvasRect;
        private ElementReference downloadLink;
        private GCHandle spawnMpqHandle;
        //private Dictionary<string, byte[]> fileSystem;

        public bool Offscreen { get; private set; }
        public int RenderInterval { get; private set; }
        public Configuration Configuration { get; private set; }
        public GameType GameType { get; private set; }
        public Timer? Timer { private get; set; }
        public GCHandle GameWasmHandle { private get; set; }

        private string FPSTarget =>
            (RenderInterval != 0) ? (1000d / RenderInterval).ToString("N2") : "0";

        [Inject]
        private AppState AppState { get; set; }
        [Inject]
        private Interop Interop { get; set; }
        [Inject]
        private Worker Worker { get; set; }
        [Inject]
        private ExceptionHandler ExceptionHandler { get; set; }
        [Inject]
        private NavigationManager NavigationManager { get; set; }
        [Inject]
        private HttpClient HttpClient { get; set; }
        [Inject]
        private IConfiguration Config { get; set; }
        //[Inject]
        //private IndexedDbManager IndexedDbManager { get; set; }

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
                return (/*(*/me.ShiftKey /*|| this.touchMods[TOUCH_SHIFT])*/ ? 1 : 0) + (me.CtrlKey ? 2 : 0) + (me.AltKey ? 4 : 0) /*+ (e.touches ? 8 : 0)*/;
            else if (e is KeyboardEventArgs ke)
                return (/*(*/ke.ShiftKey /*|| this.touchMods[TOUCH_SHIFT])*/ ? 1 : 0) + (ke.CtrlKey ? 2 : 0) + (ke.AltKey ? 4 : 0) /*+ (e.touches ? 8 : 0)*/;
            else
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
            Configuration = new Configuration(Config["Version"]); //await HttpClient.GetJsonAsync<Configuration>($"{NavigationManager.BaseUri}dist/appconfig.json");

            RenderInterval = await Interop.GetRenderInterval();

            await InitFileSystem();

            if (await Interop.HasFile(spawnFilename, spawnFilesizes))
                AppState.HasSpawn = true;

            await InitSaves();

            canvasRect = await Interop.GetCanvasRect();

            ExceptionHandler.OnException += (_, message) => Interop.Alert($"An error has occured: {message}");

            await Interop.AddEventListeners();

            await Interop.SetDotNetReference(DotNetObjectReference.Create(this));
        }

        private async Task OnRenderIntervalChange(ChangeEventArgs e) =>
            await Interop.SetRenderInterval(RenderInterval);

        private void OnCanvasMouseMove(MouseEventArgs e)
        {
            var (x, y) = MousePos(e);
            Interop.DApiMouse(0, 0, EventModifiers(e), x, y);
        }

        private void OnCanvasMouseDown(MouseEventArgs e)
        {
            var (x, y) = MousePos(e);
            Interop.DApiMouse(1, MouseButton(e), EventModifiers(e), x, y);
        }

        private void OnCanvasMouseUp(MouseEventArgs e)
        {
            var (x, y) = MousePos(e);
            Interop.DApiMouse(2, MouseButton(e), EventModifiers(e), x, y);
        }

        private void OnCanvasKeyDown(KeyboardEventArgs e)
        {
            var keyCode = GetKeyCode(e);

            if (keyCode == -1)
                return;

            Interop.DApiKey(0, EventModifiers(e), keyCode);

            if (keyCode >= 32 && e.Key.Length == 1)
                Interop.DApiChar(e.Key[0]);
            else if (/*keyCode == 8 ||*/ keyCode == 13)
                Interop.DApiChar(keyCode);
        }

        private void OnCanvasKeyUp(KeyboardEventArgs e) =>
            Interop.DApiKey(1, EventModifiers(e), GetKeyCode(e));

        private void OnMainDragEnter(DragEventArgs e) =>
            SetDropping(1);

        private void OnMainDragLeave(DragEventArgs e) =>
            SetDropping(-1);

        private void SetDropping(int change) =>
            AppState.Dropping = Max(AppState.Dropping + change, 0);

        private ValueTask InitFileSystem()
        {
            //var store = await IndexedDbManager.GetRecords<IndexedDbFile>("kv");
            //return store.ToDictionary(x => x.Name, x => x.Data);

            return Interop.InitIndexedDb();
        }

        private async Task InitSaves()
        {
            var filenames = await Interop.GetFilenames();
            var saveNames = filenames.Where(x => x.EndsWith(".sv")).ToList();
            saveNames.ForEach(x => AppState.Saves.Add(new SaveGame(x)));
        }

        private void CompressMPQ() =>
            AppState.Compress = true;

        private static string ExtractFilename(string path)
        {
            //Path.GetFileName doesn't seem to do the trick
            var index = path.LastIndexOf(@"\");
            return (index != -1) ? path[(index + 1)..] : path;
        }

        private async Task ParseSaveFile(ChangeEventArgs e)
        {
            var name = ExtractFilename(e.Value.ToString()).ToLower();
            await Upload(name);
        }

        private async Task Upload(string name)
        {
            if (name is null)
                throw new ArgumentNullException(nameof(name));

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
            var name = ExtractFilename(e.Value.ToString()).ToLower();
            await Start(name);
        }

        private void GoBack() =>
            AppState.ShowSaves = false;

        private async Task DownloadSave(string name)
        {
            var data = await Interop.ReadIndexedDbAsBase64String(name);
            await Interop.ClickDownloadLink(downloadLink, name, $"data:application/octet-stream;base64,{data}");
            //await Interop.DownloadFile(name);
        }

        private async Task RemoveSave(SaveGame saveGame)
        {
            if (!Interop.Confirm($"Are you sure you want to delete {saveGame.ShortName}?"))
                return;

            await Interop.RemoveFile(saveGame.Name);
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
                await Worker.InitGame(this);
            }
            else
            {
                if (AppState.HasSpawn)
                    await Worker.InitGame(this);
                else
                    await LoadSpawn();
            }
        }

        private async Task LoadRetail()
        {
            if (!await Interop.HasFile(retailFilename))
                if (isDrop)
                    await Interop.SetDropFile();
                else
                    await Interop.SetInputFile();
        }

        private async Task LoadSpawn()
        {
            var filesize = await Interop.GetFilesize(spawnFilename);
            if (filesize != 0 && !spawnFilesizes.Contains(filesize))
            {
                //await IndexedDbManager.DeleteRecord<string>("kv", spawnFilename);

                await Interop.RemoveFile(spawnFilename);
                filesize = 0;
            }
            if (filesize == 0)
            {
                //HttpClient.DefaultRequestHeaders.Add("Cache-Control", "max-age=31536000");
                var url = $"{NavigationManager.BaseUri}{spawnFilename}";
                //var spawn = await HttpClient.GetByteArrayAsync(url);

                //fileSystem[spawnFilename] = spawn;

                //var indexedDBFile = new IndexedDbFile { Name = spawnFilename, Data = spawn };
                //var storeRecord = new StoreRecord<IndexedDbFile> { Storename = "kv", Data = indexedDBFile };
                //await IndexedDbManager.UpdateRecord<IndexedDbFile>(storeRecord);

                //TODO: When serialization is fast enough
                //await Interop.UpdateIndexedDb(spawnFilename, spawn);

                //filesize = await Interop.DownloadAndUpdateIndexedDb(url, spawnFilename, spawnFilesizes);

                //if (!spawnFilesizes.Contains(filesize))
                //    throw new Exception("Invalid spawn.mpq size. Try clearing the cache and refreshing the page.");

                var binary = await HttpClient.GetWithProgressAsync(url, "Downloading...", spawnFilesizes[1], 524_288, OnProgress);
                spawnMpqHandle = Interop.StoreSpawnUnmarshalledBegin(binary);
            }
        }

        [JSInvokable]
        public async Task Start(string? name = null, bool isDrop = false)
        {
            //if (this.compressMpq)
            //    this.compressMpq.start(file);

            if (name != null && !name.EndsWith(".mpq"))
            {
                Interop.Alert("Please select an MPQ file. If you downloaded the installer from GoG, you will need to install it on PC and use the MPQ file from the installation folder.");
                AppState.Dropping = 0;
                StateHasChanged();
                return;
            }

            GameType = (name != null && name == retailFilename) ? GameType.Retail : GameType.Shareware;

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
                return;

            Timer?.Change(Timeout.Infinite, Timeout.Infinite);
            Timer?.Dispose();
            Timer = null;

            await Interop.Reload();
        }

        [JSInvokable]
        public async Task InitWebAssemblyUnmarshalledEnd()
        {
            await Worker.RunGame(this);

            if (GameWasmHandle.IsAllocated)
                GameWasmHandle.Free();
        }

        [JSInvokable]
        public async Task StoreSpawnUnmarshalledEnd()
        {
            await Worker.InitGame(this);

            if (spawnMpqHandle.IsAllocated)
                spawnMpqHandle.Free();
        }

        //[JSInvokable]
        //public void SetCursorPos(double x, double y) =>
        //    Interop.DApiMouse(0, 0, 0, x, y);
    }
}
