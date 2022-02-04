using File = diabloblazor.Models.File;

namespace diabloblazor.Services;

public class FileSystem
{
    private Dictionary<string, File> files = new();

    public IntPtr GetFile(string name) =>
        files[name].Address;

    public IntPtr SetFile(string name, byte[] data)
    {
        if (files.ContainsKey(name))
        {
            files[name].Free();
        }
        files[name] = new File(data);
        return files[name].Address;
    }

    public void DeleteFile(string name)
    {
        files[name].Free();
        files.Remove(name);
    }

    public int GetFilesize(string name) =>
        files.ContainsKey(name) ? files[name].Length : 0;

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
}
