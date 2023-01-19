namespace diabloblazor.Models;

public readonly record struct Image
{
    public int X { get; init; }

    public int Y { get; init; }

    public int Width { get; init; }

    public int Height { get; init; }

    public ulong Data { get; init; }
}
