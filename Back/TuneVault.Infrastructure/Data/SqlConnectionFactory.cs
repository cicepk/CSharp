using System.Data;
using Microsoft.Data.SqlClient;

namespace TuneVault.Infrastructure.Data;

// Tao IDbConnection moi cho moi lan query Dapper.
public interface ISqlConnectionFactory
{
    IDbConnection CreateConnection();
}

public class SqlConnectionFactory : ISqlConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(string connectionString)
    {
        _connectionString = connectionString;
    }

    public IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }
}
