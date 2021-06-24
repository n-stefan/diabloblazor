# DiabloBlazor <img src="https://devblogs.microsoft.com/aspnet/wp-content/uploads/sites/16/2019/04/BrandBlazor_nohalo_1000x.png" width="50" height="50" />

Based on the excellent [DiabloWeb](https://github.com/d07RiV/diabloweb) which, in turn, is based on the likewise excellent [Devilution](https://github.com/diasurgical/devilution).

As the name implies, DiabloBlazor swaps out React used in DiabloWeb for Blazor, making it a double WebAssembly app: a WebAssembly (C#) OS installable, offline capable PWA hosting a WebAssembly (C++) game. It also leverages TypeScript instead of JavaScript (except for the JavaScript glue code generated by Emscripten).

You can try it out on [GitHub Pages](https://n-stefan.github.io/diabloblazor). It is intended to be played like the original so touch controls aren't (currently) supported.

[DiabloBlazorServer](https://github.com/n-stefan/diabloblazorserver) is the development server. Clone or fork it also unless you want to use another server instead (doesn't have to be ASP.NET).

IDE: latest Visual Studio Community 2019 Preview with the Web Compiler extension installed.

If you want to try out WebAssembly AOT compilation, install the following .NET SDK workload from an elevated command prompt:

`dotnet workload install microsoft-net-sdk-blazorwebassembly-aot`

Then publish the app:

`dotnet publish -c Release`

When running locally, make sure that:
- Web Compiler has compiled site.scss
- Library Manager has restored client-side libraries
