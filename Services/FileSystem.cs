using File = diabloblazor.Models.File;

namespace diabloblazor.Services;

public class FileSystem : IFileSystem
{
    private Dictionary<string, File> files = new();

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

    public int GetFilesize(nint nameAddress)
    {
        var name = Marshal.PtrToStringAuto(nameAddress);
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

    public nint GetFileContents(nint nameAddress)
    {
        var name = Marshal.PtrToStringAuto(nameAddress);
        return files[name].Address;
    }

    public void PutFileContents(nint nameAddress, nint dataAddress, int dataLength)
    {
        var name = Marshal.PtrToStringAuto(nameAddress);
        var data = new byte[dataLength];
        Marshal.Copy(dataAddress, data, 0, dataLength);
        SetFile(name, data);
        JSImports.StoreIndexedDb(name, data);
    }

    public void RemoveFile(string name)
    {
        files[name].Free();
        files.Remove(name);
        JSImports.RemoveIndexedDb(name);
    }

    public void RemoveFile(nint nameAddress)
    {
        var name = Marshal.PtrToStringAuto(nameAddress);
        RemoveFile(name);
    }
}
