namespace TuneVault.Application.DTOs.Common;

/// <summary>
/// Response chuẩn cho tất cả API endpoints.
/// Success: { "success": true, "data": {...}, "errors": null, "message": "..." }
/// Error:   { "success": false, "data": null, "errors": [...], "message": "..." }
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string[]? Errors { get; set; }
    public string? Message { get; set; }

    // --- Thành công ---
    public static ApiResponse<T> SuccessResponse(T data, string message = "Thành công!")
        => new() { Success = true, Data = data, Errors = null, Message = message };

    // Alias cho ShareController (tương thích ngược)
    public static ApiResponse<T> SetSuccess(T data, string message = "Thành công!")
        => SuccessResponse(data, message);

    // --- Thất bại ---
    public static ApiResponse<T> ErrorResponse(string[] errors, string message = "Đã xảy ra lỗi.")
        => new() { Success = false, Data = default, Errors = errors, Message = message };

    public static ApiResponse<T> ErrorResponse(string error, string message = "Đã xảy ra lỗi.")
        => ErrorResponse(new[] { error }, message);

    // Alias dùng List<string> (tương thích ngược)
    public static ApiResponse<T> SetFailure(List<string> errors, string message = "Đã xảy ra lỗi.")
        => ErrorResponse(errors.ToArray(), message);
}
