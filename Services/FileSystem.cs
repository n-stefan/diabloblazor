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
        if (files.TryGetValue(name, out var file))
        {
            file.Free();
        }
        files[name] = new File(data);
        return files[name].Address;
    }

    public int GetFilesize(string name) =>
        files.TryGetValue(name, out var file) ? file.Length : 0;

    public int GetFilesize(IntPtr nameAddress)
    {
        var name = Utils.GetString(nameAddress);
        return GetFilesize(name);
    }

    public string[] GetFilenames() =>
        files.Keys.ToArray();

    public bool HasFile(string name, int[]? sizes = null)
    {
        if (files.TryGetValue(name, out var file))
        {
            return sizes == null || sizes.Any(x => x == file.Length);
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
        var name = Utils.GetString(nameAddress);
        return files[name].Address;
    }

    unsafe public void PutFileContents(IntPtr nameAddress, IntPtr dataAddress, int dataLength)
    {
        var name = Utils.GetString(nameAddress);
        var span = new ReadOnlySpan<byte>(dataAddress.ToPointer(), dataLength);
        var data = span.ToArray(); //TODO
        SetFile(name, data);
        JSImports.StoreIndexedDb(name, data);
    }

    public void RemoveFile(string name)
    {
        files[name].Free();
        files.Remove(name);
        interop.RemoveIndexedDb(name);
    }

    public void RemoveFile(IntPtr nameAddress)
    {
        var name = Utils.GetString(nameAddress);
        RemoveFile(name);
    }
}
