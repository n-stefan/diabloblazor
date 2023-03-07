namespace diabloblazor.Models;

public record class RenderBatch
{
    public ImageBitmap? Bitmap { get; init; }

    public List<Image> Images { get; init; } = new();

    public List<TextDef> Text { get; init; } = new();

    public Clip Clip { get; set; }

    public void FreeImages() =>
        Images.ForEach(image => Marshal.FreeHGlobal((nint)image.Data));
}
