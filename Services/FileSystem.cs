using File = diabloblazor.Models.File;

namespace diabloblazor.Services;

public class FileSystem : IFileSystem
{
    private Dictionary<string, File> files = new();
    private readonly IInterop interop;

    public FileSystem(IInterop interop) =>
        this.interop = interop;

    public IntPtr SetFile(string name, byte[] data)
    {
        if (files.ContainsKey(name))
        {
            files[name].Free();
        }
        files[name] = new File(data);
        return files[name].Address;
    }

    public int GetFilesize(string name) =>
        files.ContainsKey(name) ? files[name].Length : 0;

    public int GetFilesize(IntPtr nameAddress)
    {
        var name = GetString(nameAddress);
        return GetFilesize(name);
    }

    public string[] GetFilenames() =>
        files.Keys.ToArray();

    public bool HasFile(string name, int[]? sizes = null)
    {
        if (files.ContainsKey(name))
        {
            return sizes == null || sizes.Any(x => x == files[name].Length);
        }
        return false;
    }

    public void Free()
    {
        foreach (var file in files)
        {
            file.Value.Free();
        }
        files.Clear();
        files = null;
    }

    public IntPtr GetFileContents(IntPtr nameAddress)
    {
        var name = GetString(nameAddress);
        return files[name].Address;
    }

    unsafe public void PutFileContents(IntPtr nameAddress, IntPtr dataAddress, int dataLength)
    {
        var name = GetString(nameAddress);
        var span = new ReadOnlySpan<byte>(dataAddress.ToPointer(), dataLength);
        var data = span.ToArray();
        var fileAddress = SetFile(name, data);
        interop.StoreIndexedDb(nameAddress, fileAddress, data.Length);
    }

    public void RemoveFile(string name)
    {
        files[name].Free();
        files.Remove(name);
        interop.RemoveIndexedDb(name);
    }

    public void RemoveFile(IntPtr nameAddress)
    {
        var name = GetString(nameAddress);
        RemoveFile(name);
    }
}
