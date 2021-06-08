using diabloblazor.JsonConverters;
using System.Text.Json.Serialization;

namespace diabloblazor.Models
{
    [JsonConverter(typeof(ByteArrayConverter))]
    public record ByteArray(byte[] Data);
}
