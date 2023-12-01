﻿namespace diabloblazor.Services;

public class Graphics(IInterop interop) : IGraphics
{
    private RenderBatch renderBatch;

    public void DrawBegin() =>
        renderBatch = new();

    public void DrawEnd()
    {
        interop.Render(renderBatch);
        renderBatch.FreeImages();
        renderBatch = null;
    }

    public void DrawBlit(int x, int y, int w, int h, nint dataAddress) =>
        renderBatch.Images.Add(new Image { X = x, Y = y, Width = w, Height = h, Data = (ulong)dataAddress });

    public void DrawClipText(int x0, int y0, int x1, int y1) =>
        renderBatch.Clip = new Clip { X0 = x0, Y0 = y0, X1 = x1, Y1 = y1 };

    public void DrawText(int x, int y, nint textAddress, int color)
    {
        var text = Marshal.PtrToStringAuto(textAddress);
        renderBatch.Text.Add(new TextDef { X = x, Y = y, Text = text, Color = color });
    }
}
