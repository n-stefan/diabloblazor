using diabloblazor.Services;
using Microsoft.AspNetCore.Blazor.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;

namespace diabloblazor
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebAssemblyHostBuilder.CreateDefault(args);

            builder.Services.AddScoped<AppState>();
            builder.Services.AddScoped<Interop>();
            builder.Services.AddScoped<Worker>();
            builder.Services.AddSingleton<ExceptionHandler>();
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

            var host = builder.Build();
            await host.RunAsync();
        }
    }
}
