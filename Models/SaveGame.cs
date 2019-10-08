using diabloblazor.Enums;
using System.IO;

namespace diabloblazor.Models
{
    public struct SaveGame
    {
        public string Name { get; }

        public string ShortName { get; }

        public GameType GameType { get; }

        public SaveGame(string name)
        {
            Name = name;
            ShortName = Path.GetFileNameWithoutExtension(name);
            GameType = name.ToLower().StartsWith("spawn") ? GameType.Shareware : GameType.Retail;
        }
    }
}
