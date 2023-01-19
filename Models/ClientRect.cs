namespace diabloblazor.Models;

public readonly record struct ClientRect
{
    public double Bottom { get; init; }

    public double Left { get; init; }

    public double Right { get; init; }

    public double Top { get; init; }
}
