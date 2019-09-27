using diabloblazor.Services;
using Microsoft.AspNetCore.Components.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace diabloblazor
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddScoped<AppState>();

            services.AddScoped<Interop>();

            services.AddScoped<Worker>();

            services.AddSingleton<ExceptionHandler>();

            //services.AddIndexedDB(db =>
            //{
            //    db.DbName = "diablo_fs";
            //    db.Version = 1;
            //    db.Stores.Add(new StoreSchema
            //    {
            //        Name = "kv",
            //        PrimaryKey = new IndexSpec { KeyPath = "Name", Name = "Name", Auto = false }
            //    });
            //});
        }

        public void Configure(IComponentsApplicationBuilder app)
        {
            app.AddComponent<App>("app");
        }
    }
}
