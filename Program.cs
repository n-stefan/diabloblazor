var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddSingleton(new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<AppState>();
builder.Services.AddScoped<Interop>();
builder.Services.AddSingleton<ExceptionHandler>();
//builder.Services.AddScoped<Worker>();
//builder.Services.AddIndexedDB(db =>
//{
//    db.DbName = "diablo_fs";
//    db.Version = 1;
//    db.Stores.Add(new StoreSchema
//    {
//        Name = "kv",
//        PrimaryKey = new IndexSpec { KeyPath = "Name", Name = "Name", Auto = false }
//    });
//});

builder.RootComponents.Add<App>("app");

await builder.Build().RunAsync();
