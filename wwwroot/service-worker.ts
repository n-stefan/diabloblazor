
const serviceWorker: any = self; //as unknown as ServiceWorkerGlobalScope;
const cacheName: string = 'DiabloOfflineCache';
const gitHubPagesHostname: string = 'n-stefan.github.io';
let handleAsOfflineUntil: number = 0;

serviceWorker.addEventListener('install', async (event: any /*InstallEvent*/) => {
    //No PWA offline capability for GitHub Pages as initial caching takes too long
    if (serviceWorker.location.hostname === gitHubPagesHostname) {
        console.info('Installing service worker...');
        serviceWorker.skipWaiting();
    } else {
        console.info('Installing service worker and populating cache...');
        await Promise.all((await caches.keys()).map(key => caches.delete(key)));
        await (await caches.open(cacheName)).addAll([
            '_framework/blazor.boot.json',
            '_framework/blazor.webassembly.js',
            '_framework/wasm/dotnet.3.2.0-preview2.20159.2.js',
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
            'dist/appconfig.json',
            'manifest.json',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0',
            'spawn.mpq', //25MB
            'Diablo.wasm',
            'DiabloSpawn.wasm'
        ]);
        serviceWorker.skipWaiting();
    }
});

serviceWorker.addEventListener('fetch', (event: any /*FetchEvent*/): Response => {
    if (event.request.method !== 'GET')
        return;

    //No PWA offline capability for GitHub Pages as initial caching takes too long
    if (serviceWorker.location.hostname === gitHubPagesHostname)
        return null;
    else
        event.respondWith(getFromNetworkOrCache(event.request));
});
  
async function getFromNetworkOrCache(request: Request) {
    if (new Date().valueOf() > handleAsOfflineUntil) {
        try {
            const networkResponse = await fetchWithTimeout(request, 1000);
            //(await caches.open(cacheName)).put(request, networkResponse.clone());
            console.info(`From the network: ${request.url}`);
            return networkResponse;
        } catch (ex) {
            handleAsOfflineUntil = new Date().valueOf() + 3000;
        }
    }

    console.info(`From the offline cache: ${request.url}`);
    return caches.match(request);
}

function fetchWithTimeout(request: Request, timeout: number): Promise<Response> {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject('Fetch timed out'), timeout);
        fetch(request).then(resolve, reject);
    });
}
