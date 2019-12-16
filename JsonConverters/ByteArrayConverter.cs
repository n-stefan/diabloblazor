using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace diabloblazor.JsonConverters
{
    [JsonConverter(typeof(ByteArrayConverter))]
    public class ByteArray
    {
        public byte[] Data { get; }

        public ByteArray(byte[] data) =>
            Data = data;

        private sealed class ByteArrayConverter : JsonConverter<ByteArray>
        {
            public override ByteArray Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
                new ByteArray(reader.GetBytesFromBase64());

            // Too slow currently; AOT/.NET 5 should help
            // Filesize: 50_274_091
            //             
            // writer.WriteStringValue(Convert.ToBase64String(value._data));
            // Duration: 20:59 -> 24:04
            // 
            // writer.WriteStartArray();
            // for (var i = 0; i < value._data.Length; i++) writer.WriteNumberValue(value._data[i]);
            // writer.WriteEndArray();
            // Duration: 41:44 -> 49:43
            public override void Write(Utf8JsonWriter writer, ByteArray value, JsonSerializerOptions options) =>
                writer.WriteBase64StringValue(value.Data);
        }
    }
}
