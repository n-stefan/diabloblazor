namespace diabloblazor.Services;

public class AppState : IAppState
{
    public bool Loading { get; set; }

    public bool Started { get; set; }

    public bool Compress { get; set; }

    public bool HasSpawn { get; set; }

    public bool ShowSaves { get; set; }

    public bool Error { get; set; }

    public int Dropping { get; set; }

    public Progress Progress { get; set; }

    public Collection<SaveGame> Saves { get; } = new();
}
