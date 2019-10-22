using System;
using System.IO;
using System.Text;

namespace diabloblazor.Services
{
    public class ExceptionHandler : TextWriter
    {
        private readonly TextWriter _consoleWriter;

        public override Encoding Encoding => Encoding.UTF8;

        public event EventHandler<string>? OnException;

        public ExceptionHandler()
        {
            _consoleWriter = Console.Error;
            Console.SetError(this);
        }

        public override void WriteLine(string message)
        {
            OnException?.Invoke(this, message);
            _consoleWriter.WriteLine(message);
        }
    }
}
