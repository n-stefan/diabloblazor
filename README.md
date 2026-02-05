# DiabloBlazor

Based on the excellent [DiabloWeb](https://github.com/d07RiV/diabloweb) which, in turn, is based on the likewise excellent [Devilution](https://github.com/diasurgical/devilution).

As the name implies, DiabloBlazor swaps out React used in DiabloWeb for Blazor, making it a double WebAssembly app: a WebAssembly (C#) OS installable, offline capable PWA hosting a WebAssembly (C++) game. It also leverages TypeScript.

You can try it out on [GitHub Pages](https://n-stefan.github.io/diabloblazor). It is intended to be played like the original so touch controls aren't (currently) supported.

[DiabloBlazorServer](https://github.com/n-stefan/diabloblazorserver) is the development server. Clone or fork it also (unless you want to use another server instead) and set it as the startup project.

The game's source code is [here](https://github.com/n-stefan/devilution).

IDE: Visual Studio 2022/2026. In recent versions Rebuild may not work, in which case Clean & Build can be used instead.

The `wasm-tools` SDK workload is required, install it from an elevated command prompt:

`dotnet workload install wasm-tools`

If you want to try out WebAssembly AOT compilation, publish the app:

`dotnet publish -c Release`
