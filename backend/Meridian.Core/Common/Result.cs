namespace Meridian.Core.Common;

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Value { get; private set; }
    public string? Error { get; private set; }

    private Result(T value) { IsSuccess = true; Value = value; }
    private Result(string error) { IsSuccess = false; Error = error; }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error) => new(error);
}

public class Result
{
    public bool IsSuccess { get; private set; }
    public string? Error { get; private set; }

    private Result(bool success, string? error = null) { IsSuccess = success; Error = error; }

    public static Result Success() => new(true);
    public static Result Failure(string error) => new(false, error);
}
