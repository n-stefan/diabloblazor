namespace diabloblazor.Models;

[JsonConverter(typeof(ByteArrayConverter))]
public record class ByteArray(byte[] Data);
