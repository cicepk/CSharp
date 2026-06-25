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
    public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
        => new() { Success = true, Data = data, Errors = null, Message = message };

    // --- Thất bại ---
    public static ApiResponse<T> ErrorResponse(string[] errors, string message = "An error occurred.")
        => new() { Success = false, Data = default, Errors = errors, Message = message };

    public static ApiResponse<T> ErrorResponse(string error, string message = "An error occurred.")
        => ErrorResponse(new[] { error }, message);
}
