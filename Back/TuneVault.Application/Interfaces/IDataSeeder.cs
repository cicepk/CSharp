public interface IDataSeeder
{
    /// Seed tất cả dữ liệu mẫu vào database
    Task SeedAsync();

    /// Nếu đã có data → skip seeding (tránh duplicate)
    Task<bool> IsSeededAsync();
}
