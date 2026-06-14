using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TuneVault.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    // Client kết nối vào — không cần override nếu chỉ dùng Clients.User()
    // SignalR tự nhận diện user qua ClaimTypes.NameIdentifier (= JWT sub)
}
