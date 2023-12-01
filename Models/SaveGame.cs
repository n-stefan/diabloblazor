namespace diabloblazor.Models;

public readonly record struct SaveGame
{
    public string Name { get; }

    public string ShortName { get; }

    public GameType GameType { get; }

    public SaveGame(string name)
    {
        ArgumentNullException.ThrowIfNull(name);

        Name = name;
        ShortName = Path.GetFileNameWithoutExtension(name);
        GameType = name.ToLower().StartsWith("spawn", StringComparison.InvariantCulture) ? GameType.Shareware : GameType.Retail;
    }
}
