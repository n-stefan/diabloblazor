namespace diabloblazor.Models;

[JsonConverter(typeof(ByteArrayConverter))]
public record ByteArray(byte[] Data);
