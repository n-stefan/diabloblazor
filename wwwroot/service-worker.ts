
const cacheName: string = 'Diablo';

self.addEventListener('install', async event => {
    //No PWA offline capability for GitHub Pages as initial caching takes too long
    //console.log('Installing service worker...');
    //(self as any).skipWaiting();
    //return;
    //Comment the above lines for local deployment

    console.log('Installing service worker and populating cache...');
    (event as any).waitUntil(caches.open(cacheName).then(cache => {
        return cache.addAll([
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
            'dist/manifest.json',
            'dist/appconfig.json',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0',
            '_framework/_bin/Microsoft.AspNetCore.Authorization.dll',
            '_framework/_bin/Microsoft.AspNetCore.Blazor.HttpClient.dll',
            '_framework/_bin/Microsoft.AspNetCore.Blazor.dll',
            '_framework/_bin/Microsoft.AspNetCore.Components.Forms.dll',
            '_framework/_bin/Microsoft.AspNetCore.Components.Web.dll',
            '_framework/_bin/Microsoft.AspNetCore.Components.dll',
            '_framework/_bin/Microsoft.AspNetCore.Metadata.dll',
            '_framework/_bin/Microsoft.Bcl.AsyncInterfaces.dll',
            '_framework/_bin/Microsoft.Extensions.DependencyInjection.Abstractions.dll',
            '_framework/_bin/Microsoft.Extensions.DependencyInjection.dll',
            '_framework/_bin/Microsoft.Extensions.Logging.Abstractions.dll',
            '_framework/_bin/Microsoft.Extensions.Options.dll',
            '_framework/_bin/Microsoft.Extensions.Primitives.dll',
            '_framework/_bin/Microsoft.JSInterop.dll',
            '_framework/_bin/Mono.Security.dll',
            '_framework/_bin/Mono.WebAssembly.Interop.dll',
            '_framework/_bin/System.Buffers.dll',
            '_framework/_bin/System.ComponentModel.Annotations.dll',
            '_framework/_bin/System.Core.dll',
            '_framework/_bin/System.Memory.dll',
            '_framework/_bin/System.Net.Http.dll',
            '_framework/_bin/System.Numerics.Vectors.dll',
            '_framework/_bin/System.Runtime.CompilerServices.Unsafe.dll',
            '_framework/_bin/System.Text.Encodings.Web.dll',
            '_framework/_bin/System.Text.Json.dll',
            '_framework/_bin/System.Threading.Tasks.Extensions.dll',
            '_framework/_bin/System.dll',
            '_framework/_bin/diabloblazor.dll',
            '_framework/_bin/mscorlib.dll',
            '_framework/blazor.boot.json',
            '_framework/blazor.webassembly.js',
            '_framework/wasm/mono.js',
            '_framework/wasm/mono.wasm',
            'spawn.mpq', //25MB
            'Diablo.wasm',
            'DiabloSpawn.wasm'
        ]);
    }));
});

self.addEventListener('fetch', (event: any) => {
    //No PWA offline capability for GitHub Pages as initial caching takes too long
    //return null;
    //Comment the above line for local deployment

    event.respondWith(caches.match(event.request).then(cacheResponse => {
        if (cacheResponse) {
            console.log(`From the offline cache: ${event.request.url}`);
            return cacheResponse;
        }
        else return fetch(event.request).then(netResponse => {
            const responseClone = netResponse.clone();
            caches.open(cacheName).then(cache => cache.put(event.request, responseClone));
            console.log(`From the internet: ${event.request.url}`);
            return netResponse;
        }).catch(() => {
            console.error(`Could not fetch ${event.request.url} from either the offline cache or the internet!`);
            return null;
        })
    }));
});
