using File = diabloblazor.Models.File;

namespace diabloblazor.Services;

public class FileSystem : IFileSystem
{
    private Dictionary<string, File> files = [];

    public nint SetFile(string name, byte[] data)
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

    public int GetFilesize(nuint nameAddress)
    {
        var name = Marshal.PtrToStringAuto((nint)nameAddress);
        return GetFilesize(name);
    }

    public string[] GetFilenames() =>
        [.. files.Keys];

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

    public nint GetFileContents(nuint nameAddress)
    {
        var name = Marshal.PtrToStringAuto((nint)nameAddress);
        return files[name].Address;
    }

    public async Task PutFileContents(nuint nameAddress, nint dataAddress, int dataLength)
    {
        var name = Marshal.PtrToStringAuto((nint)nameAddress);
        var data = new byte[dataLength];
        Marshal.Copy(dataAddress, data, 0, dataLength);
        SetFile(name, data);
        await JSImports.StoreIndexedDb(name, data);
    }

    public async Task RemoveFile(string name)
    {
        files[name].Free();
        files.Remove(name);
        await JSImports.RemoveIndexedDb(name);
    }

    public async Task RemoveFile(nuint nameAddress)
    {
        var name = Marshal.PtrToStringAuto((nint)nameAddress);
        await RemoveFile(name);
    }
}
