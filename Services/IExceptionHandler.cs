namespace diabloblazor.Services;

public interface IExceptionHandler
{
    Encoding Encoding { get; }

    event EventHandler<ExceptionEventArgs>? Exception;

    void WriteLine(string? value);
}
