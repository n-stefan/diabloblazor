namespace diabloblazor.Services;

public interface IFileSystem
{
    void Free();

    nint GetFileContents(nuint nameAddress);

    string[] GetFilenames();

    int GetFilesize(nuint nameAddress);

    int GetFilesize(string name);

    bool HasFile(string name, int[]? sizes = null);

    (string, byte[]) PutFileContents(nuint nameAddress, nint dataAddress, int dataLength);

    string RemoveFile(nuint nameAddress);

    void RemoveFile(string name);

    nint SetFile(string name, byte[] data);
}
