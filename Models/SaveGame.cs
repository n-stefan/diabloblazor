using diabloblazor.Enums;

namespace diabloblazor.Models
{
    public struct SaveGame
    {
        public string Name { get; set; }

        public string ShortName { get; set; }

        public string PlayerName { get; set; }

        public PlayerClass PlayerClass { get; set; }

        public int PlayerLevel { get; set; }
    }
}
