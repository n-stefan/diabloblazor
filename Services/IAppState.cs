namespace diabloblazor.Services;

public interface IAppState
{
    bool Compress { get; set; }

    int Dropping { get; set; }

    bool Error { get; set; }

    bool HasSpawn { get; set; }

    bool Loading { get; set; }

    Progress Progress { get; set; }

    Collection<SaveGame> Saves { get; }

    bool ShowSaves { get; set; }

    bool Started { get; set; }
}
