
namespace diabloblazor.Models
{
    public struct Configuration
    {
        public string Version { get; }

        public Configuration(string version) =>
            Version = version;
    }
}
