namespace diabloblazor.Shared;

public static class Utils
{
    public static string GetString(nint address) =>
        Marshal.PtrToStringAuto(address);
}
