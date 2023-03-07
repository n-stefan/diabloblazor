namespace diabloblazor.Services;

public interface IFileSystem
{
    void Free();

    nint GetFileContents(nint nameAddress);

    string[] GetFilenames();

    int GetFilesize(nint nameAddress);

    int GetFilesize(string name);

    bool HasFile(string name, int[]? sizes = null);

    void PutFileContents(nint nameAddress, nint dataAddress, int dataLength);

    void RemoveFile(nint nameAddress);

    void RemoveFile(string name);

    nint SetFile(string name, byte[] data);
}
