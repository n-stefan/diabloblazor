namespace diabloblazor.JsonConverters;

public class ByteArrayConverter : JsonConverter<ByteArray>
{
    public override ByteArray Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetBytesFromBase64());

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
        writer.WriteBase64String("Data", value.Data);
}
