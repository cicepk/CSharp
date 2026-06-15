using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace TuneVault.API.Filters;

// DocumentFilter thay vì OperationFilter
// → thêm security requirement ở document level (apply cho tất cả operations)
// → pass OpenApiDocument vào constructor để HostDocument được set, serialize đúng thành {"Bearer":[]}
public class AuthorizeOperationFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        swaggerDoc.Security ??= [];
        var req = new OpenApiSecurityRequirement();
        req.Add(new OpenApiSecuritySchemeReference("Bearer", swaggerDoc), []);
        swaggerDoc.Security.Add(req);
    }
}
