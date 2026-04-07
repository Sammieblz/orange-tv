using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace OrangeTv.Api.Data;

/// <summary>
/// Design-time factory for <c>dotnet ef</c> (top-level <see cref="Program"/> entry point).
/// </summary>
public sealed class OrangeTvDbContextFactory : IDesignTimeDbContextFactory<OrangeTvDbContext>
{
    public OrangeTvDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<OrangeTvDbContext>();
        optionsBuilder.UseSqlite("Data Source=orange-tv-ef-design.db");
        return new OrangeTvDbContext(optionsBuilder.Options);
    }
}
