namespace diabloblazor.Services;

public static class Worker
{
    public static void InitGame(Main app)
    {
        if (app is null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        app.OnProgress(new Progress { Message = "Launching..." });

        RunGame(app);
    }

    unsafe public static void RunGame(Main app)
    {
        if (app is null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        var startTime = DateTime.Now;

        var version = Regex.Match(app.Config.Version, @"(\d+)\.(\d+)\.(\d+)", RegexOptions.Compiled);

        var spawn = Main.GameType == GameType.Shareware ? 1 : 0;

        delegate* unmanaged<IntPtr, int> getFilesize = &Main.GetFilesize;
        delegate* unmanaged<IntPtr, IntPtr> getFileContents = &Main.GetFileContents;
        delegate* unmanaged<IntPtr, IntPtr, int, void> putFileContents = &Main.PutFileContents;
        delegate* unmanaged<IntPtr, void> removeFile = &Main.RemoveFile;
        delegate* unmanaged<int, int, void> setCursor = &Main.SetCursor;
        delegate* unmanaged<void> exitGame = &Main.ExitGame;
        delegate* unmanaged<IntPtr, void> exitError = &Main.ExitError;
        delegate* unmanaged<int, void> currentSaveId = &Main.CurrentSaveId;

        NativeImports.DApi_Init(Convert.ToUInt32((DateTime.Now - startTime).TotalMilliseconds), app.Offscreen ? 1 : 0,
            int.Parse(version.Groups[1].Value), int.Parse(version.Groups[2].Value), int.Parse(version.Groups[3].Value), spawn,
            new[] { (IntPtr)getFilesize, (IntPtr)getFileContents, (IntPtr)putFileContents, (IntPtr)removeFile, (IntPtr)setCursor,
                (IntPtr)exitGame, (IntPtr)exitError, (IntPtr)currentSaveId });

        Main.Timer = new Timer(
            _ => NativeImports.DApi_Render(Convert.ToUInt32((DateTime.Now - startTime).TotalMilliseconds)),
        null, 0, app.RenderInterval);
    }
}
