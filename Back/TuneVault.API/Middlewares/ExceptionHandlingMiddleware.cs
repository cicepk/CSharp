using FluentValidation;
using TuneVault.Application.DTOs.Common;

namespace TuneVault.API.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        string message;
        string[] errors;

        switch (exception)
        {
            case ValidationException validationEx:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                message = "Dữ liệu đầu vào không hợp lệ.";
                errors = validationEx.Errors.Select(e => e.ErrorMessage).ToArray();
                break;

            case ArgumentException argEx:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                message = argEx.Message;
                errors = [argEx.Message];
                break;

            case InvalidOperationException invEx:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                message = invEx.Message;
                errors = [invEx.Message];
                break;

            case KeyNotFoundException notFoundEx:
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                message = notFoundEx.Message;
                errors = [notFoundEx.Message];
                break;

            case UnauthorizedAccessException:
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                message = "Bạn không có quyền thực hiện thao tác này.";
                errors = [message];
                break;

            default:
                _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                message = "Đã xảy ra lỗi hệ thống.";
                errors = [message];
                break;
        }

        var response = ApiResponse<object>.ErrorResponse(errors, message);
        await context.Response.WriteAsJsonAsync(response);
    }
}
