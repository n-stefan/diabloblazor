namespace diabloblazor.Models;

[JsonConverter(typeof(ByteArrayConverter))]
public class ByteArray(byte[] data)
{
    public byte[] Data => data;
}
