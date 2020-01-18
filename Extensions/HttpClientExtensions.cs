using diabloblazor.Models;
using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace diabloblazor.Extensions
{
    public static class HttpClientExtensions
    {
        public static async Task<byte[]> GetWithProgressAsync(this HttpClient httpClient, string url, string message, int totalSize, int bufferSize, Action<Progress> onProgress)
        {
            using var response = await httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
            response.EnsureSuccessStatusCode();
            using var stream = await response.Content.ReadAsStreamAsync();
            var bytesRead = 0;
            var totalBytesRead = 0;
            var data = new byte[totalSize];
            do
            {
                var count = (totalBytesRead + bufferSize > totalSize) ? totalSize - totalBytesRead : bufferSize;
                bytesRead = await stream.ReadAsync(data, totalBytesRead, count);
                totalBytesRead += bytesRead;
                onProgress?.Invoke(new Progress { Message = message, BytesLoaded = totalBytesRead, Total = totalSize });
                await Task.Delay(5);
            }
            while (bytesRead != 0);
            return data;
        }
    }
}
