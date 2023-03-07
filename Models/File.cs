namespace diabloblazor.Models;

public class File
{
    private byte[] _data;

    private readonly GCHandle _handle;

    public int Length =>
        _data.Length;

    public nint Address =>
        _handle.AddrOfPinnedObject();

    public File(byte[] data)
    {
        _data = data;
        _handle = GCHandle.Alloc(_data, GCHandleType.Pinned);
    }

    public void Free()
    {
        if (_handle.IsAllocated)
        {
            _handle.Free();
        }
        if (_data is not null)
        {
            Array.Clear(_data);
            _data = null;
        }
    }
}
