namespace diabloblazor.Extensions;

public static class HttpClientExtensions
{
    public static async Task<byte[]> GetWithProgressAsync(this HttpClient httpClient, Uri uri, string message, int totalSize, int bufferSize, Action<Progress> onProgress)
    {
        using var request = new HttpRequestMessage { Method = HttpMethod.Get, RequestUri = uri };
        request.SetBrowserResponseStreamingEnabled(true);

        using var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync();
        
        var bytesRead = 0;
        var totalBytesRead = 0;
        var data = new byte[totalSize];

        do
        {
            var count = Min(totalSize - totalBytesRead, bufferSize);
            bytesRead = await stream.ReadAsync(data, totalBytesRead, count);
            totalBytesRead += bytesRead;
            onProgress?.Invoke(new Progress { Message = message, BytesLoaded = totalBytesRead, Total = totalSize });
            await Task.Delay(10);
        }
        while (bytesRead != 0);

        return data;
    }
}
