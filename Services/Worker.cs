namespace diabloblazor.Services;

public partial class Worker : IWorker
{
    public void InitGame(Main app)
    {
        if (app is null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        app.OnProgress(new Progress { Message = "Launching..." });

        RunGame(app);
    }

    unsafe public void RunGame(Main app)
    {
        if (app is null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        var startTime = DateTime.Now;

        var version = VersionRegex().Match(app.Config.Version);

        var spawn = Main.GameType == GameType.Shareware ? 1 : 0;

        delegate* unmanaged<IntPtr, int> getFilesize = &Main.GetFilesize;
        delegate* unmanaged<IntPtr, IntPtr> getFileContents = &Main.GetFileContents;
        delegate* unmanaged<IntPtr, IntPtr, int, void> putFileContents = &Main.PutFileContents;
        delegate* unmanaged<IntPtr, void> removeFile = &Main.RemoveFile;
        delegate* unmanaged<int, int, void> setCursor = &Main.SetCursor;
        delegate* unmanaged<void> exitGame = &Main.ExitGame;
        delegate* unmanaged<IntPtr, void> exitError = &Main.ExitError;
        delegate* unmanaged<int, void> currentSaveId = &Main.CurrentSaveId;
        delegate* unmanaged<void> drawBegin = &Main.DrawBegin;
        delegate* unmanaged<void> drawEnd = &Main.DrawEnd;
        delegate* unmanaged<int, int, int, int, IntPtr, void> drawBlit = &Main.DrawBlit;
        delegate* unmanaged<int, int, int, int, void> drawClipText = &Main.DrawClipText;
        delegate* unmanaged<int, int, IntPtr, int, void> drawText = &Main.DrawText;

        NativeImports.DApi_Init(Convert.ToUInt32((DateTime.Now - startTime).TotalMilliseconds), app.Offscreen ? 1 : 0,
            int.Parse(version.Groups[1].Value), int.Parse(version.Groups[2].Value), int.Parse(version.Groups[3].Value), spawn,
            new[] { (IntPtr)getFilesize, (IntPtr)getFileContents, (IntPtr)putFileContents, (IntPtr)removeFile, (IntPtr)setCursor,
                (IntPtr)exitGame, (IntPtr)exitError, (IntPtr)currentSaveId, (IntPtr)drawBegin, (IntPtr)drawEnd, (IntPtr)drawBlit,
                (IntPtr)drawClipText, (IntPtr)drawText });

        Main.Timer = new Timer(
            _ => NativeImports.DApi_Render(Convert.ToUInt32((DateTime.Now - startTime).TotalMilliseconds)),
        null, 0, app.RenderInterval);
    }

    [GeneratedRegex(@"(\d+)\.(\d+)\.(\d+)", RegexOptions.Compiled)]
    private static partial Regex VersionRegex();
}
