namespace TuneVault.Application.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; private set; }
        public string Message { get; private set; } = null!;  
        public T? Data { get; private set; }
        public List<string>? Errors { get; private set; }

        private ApiResponse() { }

        public static ApiResponse<T> SetSuccess(T data, string message = "Thành công!")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                Errors = null
            };
        }

        public static ApiResponse<T> SetFailure(List<string> errors, string message = "Thất bại!")
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default,
                Errors = errors
            };
        }
    }
}