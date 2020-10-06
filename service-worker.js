self.addEventListener('install', (event) => event.waitUntil(onInstall(event)));
self.addEventListener('fetch', (event) => event.respondWith(onFetch(event)));
const cacheName = 'DiabloOfflineCache';
const gitHubPagesHostname = 'n-stefan.github.io';
async function onInstall(event) {
    console.info('Installing service worker');
    await caches.delete(cacheName);
    await caches.open(cacheName).then(cache => cache.addAll([
        '/diabloblazor/_framework/blazor.boot.json',
        '/diabloblazor/_framework/blazor.webassembly.js',
        '/diabloblazor/_framework/dotnet.5.0.0-rc.1.20451.14.js',
        '/diabloblazor/index.html',
        '/diabloblazor/dist/brotli.decode.min.js',
        '/diabloblazor/dist/external.min.css',
        '/diabloblazor/dist/external.min.js',
        '/diabloblazor/dist/diablo.min.css',
        '/diabloblazor/dist/diablo.min.js',
        '/diabloblazor/dist/diablo.js',
        '/diabloblazor/dist/diabloheavy.ttf',
        '/diabloblazor/dist/favicon.ico',
        '/diabloblazor/dist/icon-192.png',
        '/diabloblazor/dist/icon-512.png',
        '/diabloblazor/manifest.json',
        '/diabloblazor/appsettings.json',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0',
        '/diabloblazor/Diablo.wasm',
        '/diabloblazor/DiabloSpawn.wasm'
    ]));
}
async function onFetch(event) {
    if (event.request.method !== 'GET')
        return null;
    try {
        const fromNetwork = await fetch(event.request);
        if (fromNetwork) {
            console.info(`From the network: ${event.request.url}`);
            return fromNetwork;
        }
    }
    catch (e) {
        const shouldServeIndexHtml = event.request.mode === 'navigate';
        const request = shouldServeIndexHtml ? '/diabloblazor/index.html' : event.request;
        const cache = await caches.open(cacheName);
        const fromCache = await cache.match(request);
        if (fromCache) {
            console.info(`From the offline cache: ${event.request.url}`);
            return fromCache;
        }
        console.error(`Couldn't fetch ${event.request.url} from either the network or the offline cache`);
        return null;
    }
}
//# sourceMappingURL=service-worker.js.map