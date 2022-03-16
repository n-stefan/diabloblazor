namespace diabloblazor.Services;

public class ExceptionHandler : TextWriter, IExceptionHandler
{
    private readonly TextWriter _consoleWriter;

    public override Encoding Encoding => Encoding.UTF8;

    public event EventHandler<ExceptionEventArgs>? Exception;

    public ExceptionHandler()
    {
        _consoleWriter = Console.Error;
        Console.SetError(this);
    }

    public override void WriteLine(string? value)
    {
        if (value is null)
        {
            throw new ArgumentNullException(nameof(value));
        }

        Exception?.Invoke(this, new ExceptionEventArgs { Message = value });
        _consoleWriter.WriteLine(value);
    }
}
