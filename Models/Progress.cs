namespace diabloblazor.Models;

public record struct Progress
{
    public string Message { get; init; }

    public long Total { get; init; }

    public long BytesLoaded { get; init; }

    public double PercentLoaded => Total != 0 ? Round(100d * BytesLoaded / Total) : 100d;
}
