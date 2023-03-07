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

        delegate* unmanaged<nint, int> getFilesize = &Main.GetFilesize;
        delegate* unmanaged<nint, nint> getFileContents = &Main.GetFileContents;
        delegate* unmanaged<nint, nint, int, void> putFileContents = &Main.PutFileContents;
        delegate* unmanaged<nint, void> removeFile = &Main.RemoveFile;
        delegate* unmanaged<int, int, void> setCursor = &Main.SetCursor;
        delegate* unmanaged<void> exitGame = &Main.ExitGame;
        delegate* unmanaged<nint, void> exitError = &Main.ExitError;
        delegate* unmanaged<int, void> currentSaveId = &Main.CurrentSaveId;
        delegate* unmanaged<void> drawBegin = &Main.DrawBegin;
        delegate* unmanaged<void> drawEnd = &Main.DrawEnd;
        delegate* unmanaged<int, int, int, int, nint, void> drawBlit = &Main.DrawBlit;
        delegate* unmanaged<int, int, int, int, void> drawClipText = &Main.DrawClipText;
        delegate* unmanaged<int, int, nint, int, void> drawText = &Main.DrawText;

        NativeImports.DApi_Init(Convert.ToUInt32((DateTime.Now - startTime).TotalMilliseconds), app.Offscreen ? 1 : 0,
            int.Parse(version.Groups[1].Value), int.Parse(version.Groups[2].Value), int.Parse(version.Groups[3].Value), spawn,
            new[] { (nint)getFilesize, (nint)getFileContents, (nint)putFileContents, (nint)removeFile, (nint)setCursor,
                (nint)exitGame, (nint)exitError, (nint)currentSaveId, (nint)drawBegin, (nint)drawEnd, (nint)drawBlit,
                (nint)drawClipText, (nint)drawText });

        Main.Timer = new Timer(
            _ => NativeImports.DApi_Render(Convert.ToUInt32((DateTime.Now - startTime).TotalMilliseconds)),
        null, 0, app.RenderInterval);
    }

    [GeneratedRegex(@"(\d+)\.(\d+)\.(\d+)", RegexOptions.Compiled)]
    private static partial Regex VersionRegex();
}
