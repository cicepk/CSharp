using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TuneVault.Application.Common;
using TuneVault.Application.DTOs.Share;
using TuneVault.Application.Features.Share;
using TuneVault.Application.Features.Share.Queries;


namespace TuneVault.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/share")]
    public class ShareController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ShareController(IMediator mediator)
        {
            _mediator = mediator;
        }

        private Guid? GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        /// <summary>
        /// Chia sẻ bài hát hoặc playlist cho user khác.
        /// POST /api/share
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<Guid>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> ShareMedia([FromBody] ShareMediaRequest request)
        {
            var senderId = GetCurrentUserId();
            if (senderId is null)
                return Unauthorized(ApiResponse<object>.SetFailure(new() { "Token không hợp lệ hoặc đã hết hạn." }));

            var command = new ShareMediaCommand
            {
                SenderId       = senderId.Value,
                ReceiverUserId = request.ReceiverUserId,
                MediaItemId    = request.MediaItemId,
                PlaylistId     = request.PlaylistId
            };

            var shareId = await _mediator.Send(command);
            return Ok(ApiResponse<Guid>.SetSuccess(shareId, "Chia sẻ thành công!"));
        }

        /// <summary>
        /// Xem danh sách media được chia sẻ đến tôi.
        /// GET /api/share/inbox
        /// </summary>
        [HttpGet("inbox")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MediaShareDto>>), 200)]
        public async Task<IActionResult> GetInbox()
        {
            var userId = GetCurrentUserId();
            if (userId is null)
                return Unauthorized(ApiResponse<object>.SetFailure(new() { "Token không hợp lệ hoặc đã hết hạn." }));

            var query = new GetShareInboxQuery { UserId = userId.Value };
            var result = await _mediator.Send(query);

            return Ok(ApiResponse<IEnumerable<MediaShareDto>>.SetSuccess(result, "Lấy danh sách chia sẻ thành công."));
        }

        /// <summary>
        /// Xem danh sách media tôi đã chia sẻ đi.
        /// GET /api/share/sent
        /// </summary>
        [HttpGet("sent")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MediaShareDto>>), 200)]
        public async Task<IActionResult> GetSent()
        {
            var userId = GetCurrentUserId();
            if (userId is null)
                return Unauthorized(ApiResponse<object>.SetFailure(new() { "Token không hợp lệ hoặc đã hết hạn." }));

            var query = new GetShareSentQuery { UserId = userId.Value };
            var result = await _mediator.Send(query);

            return Ok(ApiResponse<IEnumerable<MediaShareDto>>.SetSuccess(result, "Lấy danh sách đã gửi thành công."));
        }
    }
}