﻿namespace diabloblazor.Services;

public interface IGraphics
{
    void DrawBegin();

    void DrawBlit(int x, int y, int w, int h, IntPtr dataAddress);

    void DrawClipText(int x0, int y0, int x1, int y1);

    void DrawEnd();

    void DrawText(int x, int y, IntPtr textAddress, int color);
}
