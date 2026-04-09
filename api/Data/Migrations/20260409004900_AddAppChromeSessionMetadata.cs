using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrangeTv.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAppChromeSessionMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChromeProfileSegment",
                table: "apps",
                type: "TEXT",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSessionEndedAtUtc",
                table: "apps",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LastSessionExitCode",
                table: "apps",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionFreshness",
                table: "apps",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChromeProfileSegment",
                table: "apps");

            migrationBuilder.DropColumn(
                name: "LastSessionEndedAtUtc",
                table: "apps");

            migrationBuilder.DropColumn(
                name: "LastSessionExitCode",
                table: "apps");

            migrationBuilder.DropColumn(
                name: "SessionFreshness",
                table: "apps");
        }
    }
}
