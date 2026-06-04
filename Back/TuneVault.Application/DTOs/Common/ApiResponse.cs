namespace TuneVault.Application.DTOs.Common;

/// <summary>
/// Response chuẩn cho tất cả API endpoints
/// Success: { "success": true, "data": {...}, "errors": null, "message": "..." }
/// Error: { "success": false, "data": null, "errors": [...], "message": "..." }
/// </summary>
public class ApiResponse<T>
{
    // true = request thành công, false = có lỗi
    public bool Success { get; set; }

    // Dữ liệu trả về (nếu thành công), null nếu lỗi
    public T? Data { get; set; }

    // Danh sách lỗi (nếu thất bại), null nếu thành công
    public string[]? Errors { get; set; }

    // Thông báo tổng quát về kết quả
    public string? Message { get; set; }
    // Factory method: Tạo response thành công
    public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Errors = null,
            Message = message
        };
    }
    // Factory method: Tạo response lỗi (multiple errors)
    public static ApiResponse<T> ErrorResponse(string[] errors, string message = "An error occurred")
    {
        return new ApiResponse<T>
        {
            Success = false,
            Data = default,
            Errors = errors,
            Message = message
        };
    }
    // Factory method: Tạo response lỗi (single error)
    public static ApiResponse<T> ErrorResponse(string error, string message = "An error occurred")
    {
        return ErrorResponse(new[] { error }, message);
    }
}
