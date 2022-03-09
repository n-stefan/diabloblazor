namespace diabloblazor.Services;

public class Graphics
{
    private RenderBatch _renderBatch;
    private readonly Interop _interop;

    public Graphics(Interop interop) =>
        _interop = interop;

    public void DrawBegin() =>
        _renderBatch = new();

    public void DrawEnd()
    {
        _interop.Render(_renderBatch);
        _renderBatch.FreeImages();
        _renderBatch = null;
    }

    public void DrawBlit(int x, int y, int w, int h, IntPtr dataAddress) =>
        _renderBatch.Images.Add(new Image { X = x, Y = y, Width = w, Height = h, Data = (ulong)dataAddress });

    public void DrawClipText(int x0, int y0, int x1, int y1) =>
        _renderBatch.Clip = new Clip { X0 = x0, Y0 = y0, X1 = x1, Y1 = y1 };

    public void DrawText(int x, int y, IntPtr textAddress, int color)
    {
        var text = GetString(textAddress);
        _renderBatch.Text.Add(new TextDef { X = x, Y = y, Text = text, Color = color });
    }
}
