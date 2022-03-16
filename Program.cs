var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddSingleton(new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddSingleton<AppState>();
builder.Services.AddSingleton<Interop>();
builder.Services.AddSingleton<ExceptionHandler>();
builder.Services.AddSingleton<FileSystem>();
builder.Services.AddSingleton<Graphics>();

builder.RootComponents.Add<App>("app");

await builder.Build().RunAsync();
