using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrangeTv.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWatchHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "MediaItemId",
                table: "launch_sessions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "media_resume",
                columns: table => new
                {
                    MediaItemId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PositionSeconds = table.Column<double>(type: "REAL", nullable: false),
                    DurationSeconds = table.Column<double>(type: "REAL", nullable: false),
                    LastPlayedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastEventId = table.Column<Guid>(type: "TEXT", nullable: true),
                    LastLaunchSessionId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_media_resume", x => x.MediaItemId);
                    table.ForeignKey(
                        name: "FK_media_resume_media_items_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "media_items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "watch_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OccurredAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EventType = table.Column<byte>(type: "INTEGER", nullable: false),
                    LaunchSessionId = table.Column<Guid>(type: "TEXT", nullable: true),
                    AppId = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    MediaItemId = table.Column<Guid>(type: "TEXT", nullable: true),
                    PositionSeconds = table.Column<double>(type: "REAL", nullable: true),
                    DurationSeconds = table.Column<double>(type: "REAL", nullable: true),
                    PayloadJson = table.Column<string>(type: "TEXT", maxLength: 65536, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_watch_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_watch_events_apps_AppId",
                        column: x => x.AppId,
                        principalTable: "apps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_watch_events_launch_sessions_LaunchSessionId",
                        column: x => x.LaunchSessionId,
                        principalTable: "launch_sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_watch_events_media_items_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "media_items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_launch_sessions_MediaItemId",
                table: "launch_sessions",
                column: "MediaItemId");

            migrationBuilder.CreateIndex(
                name: "IX_media_resume_LastPlayedAtUtc",
                table: "media_resume",
                column: "LastPlayedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_watch_events_AppId",
                table: "watch_events",
                column: "AppId");

            migrationBuilder.CreateIndex(
                name: "IX_watch_events_LaunchSessionId",
                table: "watch_events",
                column: "LaunchSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_watch_events_MediaItemId_OccurredAtUtc",
                table: "watch_events",
                columns: new[] { "MediaItemId", "OccurredAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_watch_events_OccurredAtUtc",
                table: "watch_events",
                column: "OccurredAtUtc");

            migrationBuilder.AddForeignKey(
                name: "FK_launch_sessions_media_items_MediaItemId",
                table: "launch_sessions",
                column: "MediaItemId",
                principalTable: "media_items",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_launch_sessions_media_items_MediaItemId",
                table: "launch_sessions");

            migrationBuilder.DropTable(
                name: "media_resume");

            migrationBuilder.DropTable(
                name: "watch_events");

            migrationBuilder.DropIndex(
                name: "IX_launch_sessions_MediaItemId",
                table: "launch_sessions");

            migrationBuilder.DropColumn(
                name: "MediaItemId",
                table: "launch_sessions");
        }
    }
}
