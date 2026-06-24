namespace TuneVault.Infrastructure.Services;

public class SupabaseSettings
{
    public string Url        { get; set; } = string.Empty;
    public string ServiceKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = "tunevault";
}
