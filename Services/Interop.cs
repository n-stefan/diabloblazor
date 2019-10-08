using diabloblazor.JsonConverters;
using diabloblazor.Models;
using diabloblazor.Pages;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace diabloblazor.Services
{
    public class Interop
    {
        private readonly IJSRuntime _jsRuntime;
        private readonly IJSInProcessRuntime _jsInProcessRuntime;

        public Interop(IJSRuntime jsRuntime)
        {
            _jsRuntime = jsRuntime;
            _jsInProcessRuntime = _jsRuntime as IJSInProcessRuntime;
        }

        public void Alert(string message) =>
            _jsInProcessRuntime.InvokeVoid("alert", message);

        public bool Confirm(string message) =>
            _jsInProcessRuntime.Invoke<bool>("confirm", message);

        public async Task Log(string message) =>
            await _jsRuntime.InvokeVoidAsync("console.log", message);

        public async Task StoreDotNetReference(DotNetObjectReference<Main> reference) =>
            await _jsRuntime.InvokeVoidAsync("interop.storeDotNetReference", reference);

        public async Task InitIndexedDb() =>
            await _jsRuntime.InvokeVoidAsync("interop.fileStore.initIndexedDb");

        public async Task UpdateIndexedDb(string name, byte[] data) =>
            await _jsRuntime.InvokeVoidAsync("interop.fileStore.updateIndexedDb", name, new ByteArray(data));

        public async Task<int> DownloadAndUpdateIndexedDb(string url, string name, int[] sizes) =>
            await _jsRuntime.InvokeAsync<int>("interop.downloadAndUpdateIndexedDb", url, name, sizes);

        public async Task<ByteArray> ReadIndexedDbAsByteArray(string name) =>
            await _jsRuntime.InvokeAsync<ByteArray>("interop.fileStore.readIndexedDb", name);

        public async Task<string> ReadIndexedDbAsBase64String(string name) =>
            await _jsRuntime.InvokeAsync<string>("interop.fileStore.readIndexedDb", name);

        public async Task<bool> IndexedDbHasFile(string name) =>
            await _jsRuntime.InvokeAsync<bool>("interop.fileStore.indexedDbHasFile", name);

        public async Task ClickDownloadLink(ElementReference link, string download, string href) =>
            await _jsRuntime.InvokeVoidAsync("interop.clickDownloadLink", link, download, href);

        public async Task DownloadFile(string name) =>
            await _jsRuntime.InvokeVoidAsync("interop.fileStore.downloadFile", name);

        public async Task UploadFile() =>
            await _jsRuntime.InvokeVoidAsync("interop.fileStore.uploadFile");

        public async Task<bool> HasFile(string name, params int[] sizes) =>
            await _jsRuntime.InvokeAsync<bool>("interop.fileStore.hasFile", name, sizes);

        public async Task<string[]> GetFilenames() =>
            await _jsRuntime.InvokeAsync<string[]>("interop.fileStore.getFilenames");

        public async Task<int> GetFilesize(string name) =>
            await _jsRuntime.InvokeAsync<int>("interop.fileStore.getFilesize", name);

        public async Task RemoveFile(string name) =>
            await _jsRuntime.InvokeVoidAsync("interop.fileStore.removeFile", name);

        public async Task SetInputFile() =>
            await _jsRuntime.InvokeVoidAsync("interop.fileStore.setInputFile");

        public async Task SetDropFile() =>
            await _jsRuntime.InvokeVoidAsync("interop.fileStore.setDropFile");

        public async Task InitWebAssembly(bool isSpawn, byte[] data) =>
            await _jsRuntime.InvokeVoidAsync("interop.webassembly.initWebAssembly", isSpawn, new ByteArray(data));

        public async Task InitGraphics(bool offscreen) =>
            await _jsRuntime.InvokeVoidAsync("interop.graphics.initGraphics", offscreen);

        public async Task InitSound() =>
            await _jsRuntime.InvokeVoidAsync("interop.sound.initSound");

        public async Task SNetInitWebsocket() =>
            await _jsRuntime.InvokeVoidAsync("interop.webassembly.snetInitWebsocket");

        public async Task DApiInit(long currentDateTime, int offScreen, int version0, int version1, int version2) =>
            await _jsRuntime.InvokeVoidAsync("interop.webassembly.dapiInit", currentDateTime, offScreen, version0, version1, version2);

        public async Task DApiMouse(int action, int button, int eventModifiers, double x, double y) =>
            await _jsRuntime.InvokeVoidAsync("interop.webassembly.dapiMouse", action, button, eventModifiers, x, y);
            //_jsInProcessRuntime.InvokeVoid("interop.webassembly.dapiMouse", action, button, eventModifiers, x, y);

        public async Task DApiKey(int action, int eventModifiers, int key) =>
            await _jsRuntime.InvokeVoidAsync("interop.webassembly.dapiKey", action, eventModifiers, key);

        public async Task DApiChar(int chr) =>
            await _jsRuntime.InvokeVoidAsync("interop.webassembly.dapiChar", chr);

        public async Task CallApi(string api, params object[] args) =>
            await _jsRuntime.InvokeVoidAsync("interop.webassembly.callApi", api, args);

        public async Task<ClientRect> GetCanvasRect() =>
            await _jsRuntime.InvokeAsync<ClientRect>("interop.getCanvasRect");

        public async Task Reload() =>
            await _jsRuntime.InvokeVoidAsync("interop.reload");

        public async Task AddEventListeners() =>
            await _jsRuntime.InvokeVoidAsync("interop.addEventListeners");
    }
}
