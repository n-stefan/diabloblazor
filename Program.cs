var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddSingleton(new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddSingleton<IAppState, AppState>();
builder.Services.AddSingleton<IExceptionHandler, ExceptionHandler>();
builder.Services.AddSingleton<IFileSystem, FileSystem>();
builder.Services.AddSingleton<IGraphics, Graphics>();
builder.Services.AddSingleton<IInterop, Interop>();
builder.Services.AddSingleton<IWorker, Worker>();

builder.RootComponents.Add<App>("app");

await builder.Build().RunAsync();
