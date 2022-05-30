namespace diabloblazor.Shared;

public static class Utils
{
    unsafe public static string GetString(IntPtr address)
    {
        var span = new ReadOnlySpan<byte>(address.ToPointer(), 100);
        span = span[..span.IndexOf((byte)0)];
        return Encoding.UTF8.GetString(span);
    }
}
