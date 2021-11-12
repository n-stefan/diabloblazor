namespace diabloblazor.Models;

public record struct Progress
{
    public string Message { get; init; }

    public int Total { get; init; }

    public int BytesLoaded { get; init; }

    public double PercentLoaded => Total != 0 ? Round(100d * BytesLoaded / Total) : 100d;
}
