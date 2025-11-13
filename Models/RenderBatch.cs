namespace diabloblazor.Models;

public class RenderBatch
{
    public ImageBitmap? Bitmap { get; init; }

    public List<Image> Images { get; init; } = [];

    public List<TextDef> Text { get; init; } = [];

    public Clip Clip { get; set; }

    public void FreeImages() =>
        Images.ForEach(image => Marshal.FreeHGlobal((nint)image.Data));
}
