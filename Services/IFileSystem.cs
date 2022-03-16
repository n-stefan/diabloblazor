namespace diabloblazor.Services;

public interface IFileSystem
{
    void Free();

    IntPtr GetFileContents(IntPtr nameAddress);

    string[] GetFilenames();

    int GetFilesize(IntPtr nameAddress);

    int GetFilesize(string name);

    bool HasFile(string name, int[]? sizes = null);

    void PutFileContents(IntPtr nameAddress, IntPtr dataAddress, int dataLength);

    void RemoveFile(IntPtr nameAddress);

    void RemoveFile(string name);

    IntPtr SetFile(string name, byte[] data);
}
