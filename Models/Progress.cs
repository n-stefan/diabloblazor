using static System.Math;

namespace diabloblazor.Models
{
    public struct Progress
    {
        public string Message { get; set; }

        public int BytesLoaded { get; set; }

        public double PercentLoaded { get => Total != 0 ? Round(100d * BytesLoaded / Total) : 100d; }

        public int Total { get; set; }
    }
}
