namespace diabloblazor.Models;

public readonly record struct SaveGame
{
    public string Name { get; }

    public string ShortName { get; }

    public GameType GameType { get; }

    public SaveGame(string name)
    {
        if (name is null)
        {
            throw new ArgumentNullException(nameof(name));
        }

        Name = name;
        ShortName = Path.GetFileNameWithoutExtension(name);
        GameType = name.ToLower().StartsWith("spawn") ? GameType.Shareware : GameType.Retail;
    }
}
