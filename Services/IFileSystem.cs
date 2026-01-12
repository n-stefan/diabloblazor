namespace diabloblazor.Services;

public interface IFileSystem
{
    void Free();

    nint GetFileContents(nuint nameAddress);

    string[] GetFilenames();

    int GetFilesize(nuint nameAddress);

    int GetFilesize(string name);

    bool HasFile(string name, int[]? sizes = null);

    Task PutFileContents(nuint nameAddress, nint dataAddress, int dataLength);

    Task RemoveFile(nuint nameAddress);

    Task RemoveFile(string name);

    nint SetFile(string name, byte[] data);
}
