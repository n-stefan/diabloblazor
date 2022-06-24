
self.addEventListener('install', (event: /*ExtendableEvent*/any) => event.waitUntil(onInstall(event)));
self.addEventListener('fetch', (event: /*FetchEvent*/any) => event.respondWith(onFetch(event)));

const cacheName: string = 'DiabloOfflineCache';

async function onInstall(event: /*ExtendableEvent*/any): Promise<void> {
    console.info('Installing service worker');

    await caches.delete(cacheName);

    await caches.open(cacheName).then(cache => cache.addAll([
        location.hostname === 'localhost' ? '_framework/blazor.boot.json' : '_framework/blazor.boot.json.br',
        '_framework/blazor.webassembly.js',
        '_framework/dotnet..7mi0bgl3w0.js', // Release: hybux8huzu
        'index.html',
        'dist/decode.min.js',
        'dist/external.min.css',
        'dist/external.min.js',
        'dist/diablo.min.css',
        'dist/diablo.min.js',
        'dist/diabloheavy.ttf',
        'dist/favicon.ico',
        'dist/icon-192.png',
        'dist/icon-512.png',
        'manifest.json',
        'appsettings.json',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0'
    ]));
}

async function onFetch(event: /*FetchEvent*/any): Promise<Response> {
    if (event.request.method !== 'GET') return null;

    try {
        const fromNetwork = await fetch(event.request);
        if (fromNetwork) {
            console.info(`From the network: ${event.request.url}`);
            return fromNetwork;
        }
    } catch (e) {
        const shouldServeIndexHtml = event.request.mode === 'navigate';
        const request = shouldServeIndexHtml ? 'index.html' : event.request;
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
