namespace diabloblazor.Models;

public readonly record struct TextDef
{
    public int X { get; init; }

    public int Y { get; init; }

    public string Text { get; init; }

    public int Color { get; init; }
}
