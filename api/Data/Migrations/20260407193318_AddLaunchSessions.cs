using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrangeTv.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLaunchSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "launch_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AppId = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Pid = table.Column<int>(type: "INTEGER", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExitCode = table.Column<int>(type: "INTEGER", nullable: true),
                    SpawnError = table.Column<string>(type: "TEXT", maxLength: 2048, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_launch_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_launch_sessions_apps_AppId",
                        column: x => x.AppId,
                        principalTable: "apps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_launch_sessions_AppId",
                table: "launch_sessions",
                column: "AppId");

            migrationBuilder.CreateIndex(
                name: "IX_launch_sessions_StartedAtUtc",
                table: "launch_sessions",
                column: "StartedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "launch_sessions");
        }
    }
}
