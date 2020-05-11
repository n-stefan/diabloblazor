const serviceWorker = self;
const cacheName = 'DiabloOfflineCache';
const gitHubPagesHostname = 'n-stefan.github.io';
let handleAsOfflineUntil = 0;
serviceWorker.addEventListener('install', async (event) => {
    if (serviceWorker.location.hostname === gitHubPagesHostname) {
        console.info('Installing service worker...');
        serviceWorker.skipWaiting();
    }
    else {
        console.info('Installing service worker and populating cache...');
        await Promise.all((await caches.keys()).map(key => caches.delete(key)));
        await (await caches.open(cacheName)).addAll([
            '_framework/blazor.boot.json',
            '_framework/blazor.webassembly.js',
            '_framework/wasm/dotnet.3.2.0-rc1.20222.2.js',
            '/',
            'dist/diablo.min.css',
            'dist/diablo.min.js',
            'dist/diablo.js',
            'dist/external.min.css',
            'dist/external.min.js',
            'dist/diabloheavy.ttf',
            'dist/favicon.ico',
            'dist/icon-192.png',
            'dist/icon-512.png',
            'appsettings.json',
            'manifest.json',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0',
            'spawn.mpq',
            'Diablo.wasm',
            'DiabloSpawn.wasm'
        ]);
        serviceWorker.skipWaiting();
    }
});
serviceWorker.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET')
        return;
    if (serviceWorker.location.hostname === gitHubPagesHostname)
        return null;
    else
        event.respondWith(getFromNetworkOrCache(event.request));
});
async function getFromNetworkOrCache(request) {
    if (new Date().valueOf() > handleAsOfflineUntil) {
        try {
            const networkResponse = await fetchWithTimeout(request, 1000);
            console.info(`From the network: ${request.url}`);
            return networkResponse;
        }
        catch (ex) {
            handleAsOfflineUntil = new Date().valueOf() + 3000;
        }
    }
    console.info(`From the offline cache: ${request.url}`);
    return caches.match(request);
}
function fetchWithTimeout(request, timeout) {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject('Fetch timed out'), timeout);
        fetch(request).then(resolve, reject);
    });
}
//# sourceMappingURL=service-worker.js.map