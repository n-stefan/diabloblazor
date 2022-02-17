var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddSingleton(new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<AppState>();
builder.Services.AddScoped<Interop>();
builder.Services.AddSingleton<ExceptionHandler>();
builder.Services.AddScoped<FileSystem>();

builder.RootComponents.Add<App>("app");

await builder.Build().RunAsync();
